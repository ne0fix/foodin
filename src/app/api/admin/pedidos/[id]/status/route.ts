import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireAdmin, unauthorizedResponse } from '@/src/lib/auth';
import { notificarStatusAtualizado } from '@/src/lib/notificacoes';

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin(req)) return unauthorizedResponse();
  const params = await props.params;
  const id = params.id;

  try {
    const body = await req.json();
    const { statusCliente } = body;

    if (!statusCliente) {
      return NextResponse.json({ error: 'Status ausente' }, { status: 400 });
    }

    const pedido = await prisma.order.update({
      where: { id },
      data: { statusCliente },
      select: {
        id: true,
        statusCliente: true,
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
      statusCliente,
    ).catch(() => {});

    return NextResponse.json(pedido);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar status' }, { status: 500 });
  }
}