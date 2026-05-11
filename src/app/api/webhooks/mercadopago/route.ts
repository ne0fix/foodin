import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import MercadoPagoConfig, { Payment } from 'mercadopago';
import { createHmac } from 'crypto';
import { notificarPagamentoAprovado } from '@/src/lib/notificacoes';

const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
});
const mpPayment = new Payment(mpClient);

// Valida assinatura HMAC-SHA256 quando presente — apenas log, não bloqueia.
// Segurança principal: verificação do pagamento diretamente na API do MP.
function verificarAssinatura(req: NextRequest, rawBody: string): void {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) return;

  const xSignature = req.headers.get('x-signature');
  if (!xSignature) {
    console.warn('[webhook] x-signature ausente');
    return;
  }

  const sep = xSignature.includes(';') && !xSignature.includes(',') ? ';' : ',';
  const parts: Record<string, string> = {};
  for (const chunk of xSignature.split(sep)) {
    const idx = chunk.indexOf('=');
    if (idx > 0) parts[chunk.slice(0, idx).trim()] = chunk.slice(idx + 1).trim();
  }

  const ts = parts['ts'];
  const v1 = parts['v1'];
  if (!ts || !v1) { console.warn('[webhook] x-signature malformado:', xSignature); return; }

  let dataId = '';
  try { dataId = String(JSON.parse(rawBody)?.data?.id ?? ''); } catch { return; }

  const template = `id:${dataId};request-date:${ts};`;
  const hmac = createHmac('sha256', secret).update(template).digest('hex');

  if (hmac !== v1) {
    console.warn('[webhook] Assinatura inválida — notificação processada mesmo assim (MP API verifica)');
  }
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  // Verifica (mas não bloqueia) a assinatura — a consulta ao MP é a fonte de verdade
  verificarAssinatura(req, rawBody);

  let notification: { type: string; data: { id: string }; live_mode?: boolean };
  try {
    notification = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Payload inválido' }, { status: 400 });
  }

  // Retorna 200 para qualquer evento que não seja pagamento (ex: teste do painel)
  if (notification.type !== 'payment') {
    return NextResponse.json({ received: true });
  }

  const mpPaymentId = String(notification.data.id);

  // Consulta o status real no MP — nunca confia no payload do webhook
  let pagamento: Awaited<ReturnType<typeof mpPayment.get>>;
  try {
    pagamento = await mpPayment.get({ id: mpPaymentId });
  } catch (err) {
    // ID inválido (ex: "123456" do teste do painel) ou MP instável
    console.warn('[webhook] Pagamento não encontrado no MP:', mpPaymentId, err);
    return NextResponse.json({ received: true });
  }

  const orderId = pagamento.external_reference;
  if (!orderId) {
    return NextResponse.json({ received: true });
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      status: true,
      statusCliente: true,
      compradorNome: true,
      compradorTelefone: true,
      items: { select: { produtoId: true, quantidade: true } },
    },
  });

  if (!order) return NextResponse.json({ received: true });

  // Idempotência — pula apenas se status E statusCliente já estão no estado final correto
  const statusClienteEsperado = order.status === 'PAID'
    ? ['EM_SEPARACAO', 'LIBERADO']
    : order.status === 'FAILED' || order.status === 'CANCELLED'
      ? ['CANCELADO']
      : [];

  const statusClienteOk = statusClienteEsperado.includes(order.statusCliente as string);

  if ((order.status === 'PAID' || order.status === 'CANCELLED') && statusClienteOk) {
    return NextResponse.json({ received: true });
  }

  const novoStatus = (() => {
    switch (pagamento.status) {
      case 'approved':           return 'PAID';
      case 'rejected':
      case 'cancelled':          return 'FAILED';
      // 'pending' e 'in_process' do MP equivalem ao nosso PENDING_PAYMENT —
      // não rebaixar para PROCESSING pois o QR Code ainda precisa ser exibido
      case 'in_process':
      case 'pending':            return 'PROCESSING';
      default:                   return null;
    }
  })();

  if (!novoStatus) return NextResponse.json({ received: true });

  const statusClienteFinal =
    novoStatus === 'PAID' ? 'EM_SEPARACAO'
    : novoStatus === 'FAILED' ? 'CANCELADO'
    : 'PAGAMENTO_PROCESSANDO';

  // Não "rebaixar" de PENDING_PAYMENT para PROCESSING — são o mesmo estado
  // semântico e o rebaixamento fazia a página sumir com o QR Code do PIX
  if (order.status === 'PENDING_PAYMENT' && novoStatus === 'PROCESSING') {
    return NextResponse.json({ received: true });
  }

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: {
        status:        novoStatus,
        statusCliente: statusClienteFinal,
        mpStatus:      pagamento.status ?? null,
        mpPaymentId,
        pagoEm:        novoStatus === 'PAID' ? new Date() : undefined,
      },
    });

    // Decrementar estoque rastreado quando pagamento aprovado
    if (novoStatus === 'PAID' && order.items.length > 0) {
      for (const item of order.items) {
        await tx.produto.updateMany({
          where: { id: item.produtoId, estoqueQuantidade: { gte: 0 } },
          data: { estoqueQuantidade: { decrement: item.quantidade } },
        });
        // Marcar emEstoque=false se chegou a zero
        await tx.produto.updateMany({
          where: { id: item.produtoId, estoqueQuantidade: 0 },
          data: { emEstoque: false },
        });
      }
    }
  });

  if (novoStatus === 'PAID') {
    notificarPagamentoAprovado({
      id: orderId,
      compradorNome: order.compradorNome ?? '',
      compradorTelefone: order.compradorTelefone ?? null,
      total: 0,
    }).catch(() => {});
  }

  console.log(`[webhook] Pedido ${orderId} → ${novoStatus}`);
  return NextResponse.json({ received: true });
}
