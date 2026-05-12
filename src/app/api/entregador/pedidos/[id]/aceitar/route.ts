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

  try {
    const pedido = await prisma.order.update({
      where: {
        id,
        statusCliente: 'LIBERADO',
        entregadorId: null,
      },
      data: {
        statusCliente: 'EM_ROTA',
        entregadorId,
        aceitoEm: new Date(),
      },
      select: {
        id: true,
        statusCliente: true,
        aceitoEm: true,
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
      'EM_ROTA',
    ).catch(() => {});

    return NextResponse.json({
      id: pedido.id,
      statusCliente: pedido.statusCliente,
      aceitoEm: pedido.aceitoEm,
    });
  } catch {
    return NextResponse.json(
      { error: 'Pedido já foi aceito por outro entregador ou não está disponível' },
      { status: 409 }
    );
  }
}
