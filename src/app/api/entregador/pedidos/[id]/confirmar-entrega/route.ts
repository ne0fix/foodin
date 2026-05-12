import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { notificarStatusAtualizado } from '@/src/lib/notificacoes';

export async function PATCH(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const entregadorId = req.headers.get('X-Entregador-Id');
  if (!entregadorId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { id } = await props.params;

  const pedidoAtual = await prisma.order.findUnique({
    where: { id },
    select: { statusCliente: true, entregadorId: true },
  });

  if (!pedidoAtual) {
    return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
  }
  if (pedidoAtual.entregadorId !== entregadorId) {
    return NextResponse.json({ error: 'Você não é o entregador deste pedido' }, { status: 403 });
  }
  if (pedidoAtual.statusCliente !== 'EM_ROTA') {
    return NextResponse.json({ error: 'Pedido não está em rota' }, { status: 400 });
  }

  const pedido = await prisma.order.update({
    where: { id },
    data: {
      statusCliente: 'ENTREGUE',
      entregueEm: new Date(),
    },
    select: {
      id: true,
      statusCliente: true,
      entregueEm: true,
      compradorNome: true,
      compradorTelefone: true,
      total: true,
    },
  });

  notificarStatusAtualizado(
    {
      id: pedido.id,
      compradorNome: pedido.compradorNome,
      compradorTelefone: pedido.compradorTelefone,
      total: parseFloat(pedido.total.toString()),
    },
    'ENTREGUE',
  ).catch(() => {});

  return NextResponse.json({
    id: pedido.id,
    statusCliente: pedido.statusCliente,
    entregueEm: pedido.entregueEm,
  });
}
