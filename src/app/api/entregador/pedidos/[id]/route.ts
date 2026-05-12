import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const entregadorId = req.headers.get('X-Entregador-Id');
  if (!entregadorId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { id } = await props.params;

  const pedido = await prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
      entregador: { select: { id: true, nome: true, telefone: true } },
    },
  });

  if (!pedido) return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });

  if (pedido.statusCliente === 'EM_ROTA' && pedido.entregadorId !== entregadorId) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
  }

  return NextResponse.json({
    ...pedido,
    total: parseFloat(pedido.total.toString()),
    frete: parseFloat(pedido.frete.toString()),
    subtotal: parseFloat(pedido.subtotal.toString()),
    items: pedido.items.map(i => ({
      ...i,
      preco: parseFloat(i.preco.toString()),
      subtotal: parseFloat(i.subtotal.toString()),
    })),
  });
}
