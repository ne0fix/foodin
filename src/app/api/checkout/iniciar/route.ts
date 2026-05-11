import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import MercadoPagoConfig, { Payment } from 'mercadopago';
import { CheckoutIniciarPayload } from '@/src/models/checkout.model';
import { verifyClienteJWT } from '@/src/lib/clienteAuth';
import { notificarNovoPedido, notificarPagamentoAprovado } from '@/src/lib/notificacoes';

const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
});
const mpPayment = new Payment(mpClient);

export async function POST(req: NextRequest) {
  let body: CheckoutIniciarPayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Payload inválido' }, { status: 400 });
  }

  // ─── Verificar Cliente Logado ─────────────────────────────────────────────
  const clienteToken = req.cookies.get('cliente-token')?.value;
  const clienteAuth = clienteToken ? await verifyClienteJWT(clienteToken) : null;

  const { itens, comprador, entrega, metodo, cardToken, parcelas, issuerId, frete, paymentMethodId } = body;

  // ─── Validações básicas ──────────────────────────────────────────────────
  if (!itens?.length) return NextResponse.json({ error: 'Carrinho vazio' }, { status: 400 });
  if (!comprador?.email || !comprador?.nome) return NextResponse.json({ error: 'Dados do comprador inválidos' }, { status: 400 });
  if (metodo === 'CARTAO' && !cardToken) return NextResponse.json({ error: 'Token do cartão ausente' }, { status: 400 });
  if (!comprador?.cpf) return NextResponse.json({ error: 'CPF obrigatório' }, { status: 400 });

  // ─── Buscar produtos do banco (NUNCA confiar no preço do frontend) ────────
  const produtoIds = itens.map(i => i.produtoId);
  const produtos = await prisma.produto.findMany({
    where: { id: { in: produtoIds }, ativo: true },
    select: { id: true, nome: true, preco: true, imagem: true, emEstoque: true, estoqueQuantidade: true },
  });

  if (produtos.length !== produtoIds.length) {
    return NextResponse.json({ error: 'Um ou mais produtos não encontrados' }, { status: 400 });
  }

  // ─── Validar estoque ──────────────────────────────────────────────────────
  const semEstoque = produtos.filter(p => !p.emEstoque);
  if (semEstoque.length > 0) {
    return NextResponse.json({
      error: `Produto(s) sem estoque: ${semEstoque.map(p => p.nome).join(', ')}`,
    }, { status: 409 });
  }

  // ─── Validar quantidade disponível (quando rastreado) ────────────────────
  const produtoMap = new Map(produtos.map(p => [p.id, p]));
  for (const item of itens) {
    const produto = produtoMap.get(item.produtoId)!;
    if (produto.estoqueQuantidade >= 0 && produto.estoqueQuantidade < item.quantidade) {
      return NextResponse.json({
        error: `Estoque insuficiente para "${produto.nome}". Disponível: ${produto.estoqueQuantidade}.`,
      }, { status: 409 });
    }
  }

  // ─── Calcular valores no backend ──────────────────────────────────────────
  let subtotal = 0;
  const orderItemsData = itens.map(item => {
    const produto = produtoMap.get(item.produtoId)!;
    const preco = parseFloat(produto.preco.toString());
    const itemSubtotal = preco * item.quantidade;
    subtotal += itemSubtotal;
    return {
      produtoId: item.produtoId,
      nomeProduto: produto.nome,
      imagemProduto: produto.imagem,
      preco,
      quantidade: item.quantidade,
      subtotal: itemSubtotal,
    };
  });

  const freteCalculado = entrega.tipo === 'RETIRADA' ? 0 : (frete ?? 0);
  // Arredonda para 2 casas decimais — MP rejeita valores com muitos decimais
  const total = Math.round((subtotal + freteCalculado) * 100) / 100;

  // ─── Criar Order no banco ─────────────────────────────────────────────────
  const order = await prisma.order.create({
    data: {
      status: 'PENDING_PAYMENT',
      statusCliente: 'PEDIDO_REALIZADO',
      clienteId: clienteAuth?.clienteId ?? null,
      compradorNome: comprador.nome,
      compradorEmail: comprador.email,
      compradorCpf: comprador.cpf ?? '',
      compradorTelefone: comprador.telefone,
      entregaTipo: entrega.tipo,
      cep: entrega.cep,
      logradouro: entrega.logradouro,
      numero: entrega.numero,
      complemento: entrega.complemento,
      bairro: entrega.bairro,
      cidade: entrega.cidade,
      uf: entrega.uf,
      subtotal,
      frete: freteCalculado,
      total,
      metodoPagamento: metodo,
      items: { create: orderItemsData },
    },
  });

  // ─── Chamar Mercado Pago (Checkout Transparente) ─────────────────────────
  const notificationBase = process.env.MP_NOTIFICATION_BASE_URL || process.env.NEXT_PUBLIC_APP_URL;
  const notificationUrl = notificationBase
    ? `${notificationBase}/api/webhooks/mercadopago`
    : undefined;

  const nomePartes = comprador.nome.trim().split(' ');
  const firstName = nomePartes[0];
  const lastName  = nomePartes.slice(1).join(' ') || firstName;

  // additional_info melhora análise antifraude e exibição no painel MP
  const additionalInfo = {
    items: orderItemsData.map(item => ({
      id:          item.produtoId,
      title:       item.nomeProduto,
      quantity:    item.quantidade,
      unit_price:  item.preco,
    })),
    payer: {
      first_name: firstName,
      last_name:  lastName,
      ...(comprador.telefone && {
        phone: {
          area_code: comprador.telefone.slice(0, 2),
          number:    comprador.telefone.slice(2),
        },
      }),
      ...(entrega.tipo === 'ENTREGA' && entrega.cep && {
        address: {
          zip_code:      entrega.cep,
          street_name:   entrega.logradouro ?? '',
          street_number: entrega.numero ?? '',
        },
      }),
    },
    ...(entrega.tipo === 'ENTREGA' && entrega.cep && {
      shipments: {
        receiver_address: {
          zip_code:      entrega.cep,
          state_name:    entrega.uf ?? '',
          city_name:     entrega.cidade ?? '',
          street_name:   entrega.logradouro ?? '',
          street_number: entrega.numero ?? '',
          apartment:     entrega.complemento ?? '',
        },
      },
    }),
  };

  try {
    if (metodo === 'PIX') {
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
      const pagamento = await mpPayment.create({
        body: {
          transaction_amount: total,
          payment_method_id:  'pix',
          description: `Ekomart #${order.id.slice(-6).toUpperCase()}`,
          external_reference: order.id,
          date_of_expiration: expiresAt,
          notification_url:   notificationUrl,
          payer: {
            email:          comprador.email,
            first_name:     firstName,
            last_name:      lastName,
            identification: { type: 'CPF', number: comprador.cpf },
          },
          additional_info: additionalInfo,
        },
        requestOptions: { idempotencyKey: order.id },
      });

      const qrData = pagamento.point_of_interaction?.transaction_data;
      await prisma.order.update({
        where: { id: order.id },
        data: {
          mpPaymentId:    String(pagamento.id),
          mpStatus:       pagamento.status ?? null,
          mpQrCode:       qrData?.qr_code       ?? null,
          mpQrCodeBase64: qrData?.qr_code_base64 ?? null,
        },
      });

      // Notificar criação do pedido (fire-and-forget)
      notificarNovoPedido({
        id: order.id,
        compradorNome: order.compradorNome,
        compradorTelefone: order.compradorTelefone,
        total,
        entregaTipo: order.entregaTipo,
      }).catch(() => {});

      return NextResponse.json({
        orderId:      order.id,
        metodo:       'PIX',
        status:       'pending',
        qrCode:       qrData?.qr_code,
        qrCodeBase64: qrData?.qr_code_base64,
        expiresAt,
      });

    } else {
      // Cartão — checkout transparente com token gerado pelo CardPayment Brick
      const pagamento = await mpPayment.create({
        body: {
          transaction_amount: total,
          token:              cardToken!,
          installments:       parcelas ?? 1,
          issuer_id:          issuerId ? parseInt(issuerId) : undefined,
          payment_method_id:  paymentMethodId ?? undefined, // "visa", "master", etc.
          description: `Ekomart #${order.id.slice(-6).toUpperCase()}`,
          external_reference: order.id,
          notification_url:   notificationUrl,
          payer: {
            email:          comprador.email,
            first_name:     firstName,
            last_name:      lastName,
            identification: { type: 'CPF', number: comprador.cpf },
          },
          additional_info: additionalInfo,
        },
        requestOptions: { idempotencyKey: order.id },
      });

      const statusFinal =
        pagamento.status === 'approved' ? 'PAID'
        : pagamento.status === 'rejected' ? 'FAILED'
        : 'PROCESSING';

      const statusClienteFinal =
        statusFinal === 'PAID' ? 'EM_SEPARACAO'
        : statusFinal === 'FAILED' ? 'CANCELADO'
        : 'PAGAMENTO_PROCESSANDO';

      await prisma.order.update({
        where: { id: order.id },
        data: {
          mpPaymentId: String(pagamento.id),
          mpStatus:    pagamento.status ?? null,
          status:      statusFinal,
          statusCliente: statusClienteFinal,
          pagoEm:      statusFinal === 'PAID' ? new Date() : null,
        },
      });

      const orderInfo = {
        id: order.id,
        compradorNome: order.compradorNome,
        compradorTelefone: order.compradorTelefone,
        total,
        entregaTipo: order.entregaTipo,
      };

      // Notificar criação do pedido
      notificarNovoPedido(orderInfo).catch(() => {});

      // Notificar pagamento aprovado imediatamente se cartão já foi aprovado
      if (statusFinal === 'PAID') {
        notificarPagamentoAprovado(orderInfo).catch(() => {});
      }

      return NextResponse.json({
        orderId:      order.id,
        metodo:       'CARTAO',
        status:       pagamento.status,
        statusDetail: pagamento.status_detail,
      });
    }
  } catch (mpError: unknown) {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: 'FAILED' },
    });

    // Traduzir erros conhecidos do MP em mensagens amigáveis
    const causes = (mpError as { cause?: Array<{ code: number; description: string }> })?.cause ?? [];
    const code = causes[0]?.code;
    console.error('Mercado Pago error:', JSON.stringify(causes));

    const mensagem =
      code === 13253 ? 'CPF inválido ou não cadastrado. Verifique o CPF informado e tente novamente.' :
      code === 2001  ? 'E-mail do pagador inválido.' :
      code === 324   ? 'Token do cartão inválido ou expirado. Preencha os dados do cartão novamente.' :
      code === 3034  ? 'Bandeira do cartão não suportada.' :
      'Erro ao processar pagamento. Verifique os dados e tente novamente.';

    return NextResponse.json({ error: mensagem }, { status: 502 });
  }
}
