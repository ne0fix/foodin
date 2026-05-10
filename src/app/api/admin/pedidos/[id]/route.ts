import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const id = params.id;

  try {
    const pedido = await prisma.order.findUnique({
      where: { id },
      include: {
        cliente: true,
        items: {
          include: {
            produto: {
              select: { nome: true, imagem: true }
            }
          }
        }
      }
    });

    if (!pedido) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
    }

    return NextResponse.json({
      ...pedido,
      total: parseFloat(pedido.total.toString()),
      subtotal: parseFloat(pedido.subtotal.toString()),
      frete: parseFloat(pedido.frete.toString()),
      items: pedido.items.map(item => ({
        ...item,
        preco: parseFloat(item.preco.toString()),
        subtotal: parseFloat(item.subtotal.toString()),
      }))
    });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar pedido' }, { status: 500 });
  }
}
