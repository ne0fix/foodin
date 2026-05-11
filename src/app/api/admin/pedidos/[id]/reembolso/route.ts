import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireAdmin, unauthorizedResponse } from '@/src/lib/auth';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin(req)) return unauthorizedResponse();
  const { id } = await params;

  try {
    const order = await prisma.order.findUnique({
      where: { id },
      select: { id: true, status: true, statusCliente: true, mpPaymentId: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Pedido não encontrado.' }, { status: 404 });
    }

    if (order.status !== 'PAID') {
      return NextResponse.json(
        { error: 'Só é possível estornar pedidos com pagamento confirmado (PAID).' },
        { status: 422 },
      );
    }

    if (!order.mpPaymentId) {
      return NextResponse.json(
        { error: 'ID de pagamento do Mercado Pago não encontrado.' },
        { status: 422 },
      );
    }

    const mpRes = await fetch(
      `https://api.mercadopago.com/v1/payments/${order.mpPaymentId}/refunds`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
          'X-Idempotency-Key': `refund-${id}`,
        },
      },
    );

    if (!mpRes.ok) {
      const err = await mpRes.json().catch(() => ({}));
      console.error('Erro MP estorno:', err);
      return NextResponse.json(
        { error: 'Mercado Pago recusou o estorno.', details: err },
        { status: mpRes.status },
      );
    }

    const mpData = await mpRes.json();

    await prisma.order.update({
      where: { id },
      data: { status: 'CANCELLED', statusCliente: 'CANCELADO' },
    });

    return NextResponse.json({ success: true, refund: mpData });
  } catch (error) {
    console.error('Erro ao processar estorno:', error);
    return NextResponse.json({ error: 'Erro interno ao processar estorno.' }, { status: 500 });
  }
}
