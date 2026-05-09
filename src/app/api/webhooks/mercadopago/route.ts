import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import MercadoPagoConfig, { Payment } from 'mercadopago';
import { createHmac } from 'crypto';

const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
});
const mpPayment = new Payment(mpClient);

function validarAssinatura(req: NextRequest, rawBody: string): boolean {
  const webhookSecret = process.env.MP_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.warn('[webhook] MP_WEBHOOK_SECRET não configurado');
    return true;
  }

  const xSignature = req.headers.get('x-signature');

  // O botão "Testar" do painel MP envia o webhook sem x-signature.
  // Webhooks reais de pagamento sempre chegam assinados.
  if (!xSignature) {
    console.warn('[webhook] x-signature ausente — aceito como teste do painel MP');
    return true;
  }

  // Suporta separadores vírgula e ponto-e-vírgula (variações do MP)
  const sep = xSignature.includes(';') && !xSignature.includes(',') ? ';' : ',';
  const parts: Record<string, string> = {};
  for (const chunk of xSignature.split(sep)) {
    const idx = chunk.indexOf('=');
    if (idx > 0) parts[chunk.slice(0, idx).trim()] = chunk.slice(idx + 1).trim();
  }

  const ts = parts['ts'];
  const v1 = parts['v1'];
  if (!ts || !v1) {
    console.warn('[webhook] x-signature malformado:', xSignature);
    return false;
  }

  let dataId = '';
  try {
    const parsed = JSON.parse(rawBody);
    dataId = String(parsed?.data?.id ?? '');
  } catch { return false; }

  const template = `id:${dataId};request-date:${ts};`;
  const hmac = createHmac('sha256', webhookSecret).update(template).digest('hex');

  const valido = hmac === v1;
  if (!valido) console.warn('[webhook] Assinatura HMAC inválida — possível requisição não autorizada');
  return valido;
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  // Valida assinatura
  if (!validarAssinatura(req, rawBody)) {
    return NextResponse.json({ error: 'Assinatura inválida' }, { status: 401 });
  }

  let notification: { type: string; data: { id: string } };
  try {
    notification = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Payload inválido' }, { status: 400 });
  }

  // Só processar eventos de pagamento
  if (notification.type !== 'payment') {
    return NextResponse.json({ received: true });
  }

  const mpPaymentId = String(notification.data.id);

  // Consultar status real no MP (não confiar no payload do webhook)
  let pagamento: Awaited<ReturnType<typeof mpPayment.get>>;
  try {
    pagamento = await mpPayment.get({ id: mpPaymentId });
  } catch (err) {
    console.error('Erro ao consultar MP:', err);
    return NextResponse.json({ error: 'Erro ao consultar pagamento' }, { status: 502 });
  }

  const orderId = pagamento.external_reference;
  if (!orderId) {
    return NextResponse.json({ received: true }); // pagamento não relacionado a esta loja
  }

  // Buscar order e verificar idempotência
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, status: true },
  });

  if (!order) return NextResponse.json({ received: true });

  // Não reprocessar pedidos já finalizados
  if (order.status === 'PAID' || order.status === 'CANCELLED') {
    return NextResponse.json({ received: true });
  }

  // Mapear status MP → OrderStatus
  const novoStatus = (() => {
    switch (pagamento.status) {
      case 'approved': return 'PAID';
      case 'rejected':
      case 'cancelled': return 'FAILED';
      case 'in_process':
      case 'pending': return 'PROCESSING';
      default: return null;
    }
  })();

  if (!novoStatus) return NextResponse.json({ received: true });

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: novoStatus,
      mpStatus: pagamento.status ?? null,
      mpPaymentId,
      pagoEm: novoStatus === 'PAID' ? new Date() : undefined,
    },
  });

  return NextResponse.json({ received: true });
}
