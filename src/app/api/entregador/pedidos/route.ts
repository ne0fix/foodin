import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

export async function GET(req: NextRequest) {
  const entregadorId = req.headers.get('X-Entregador-Id');
  if (!entregadorId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') ?? 'LIBERADO';

  const where =
    status === 'EM_ROTA'
      ? { statusCliente: 'EM_ROTA' as const, entregadorId }
      : {
          statusCliente: 'LIBERADO' as const,
          entregaTipo: 'ENTREGA' as const,
          entregadorId: null,
        };

  const pedidos = await prisma.order.findMany({
    where,
    orderBy: { criadoEm: 'asc' },
    select: {
      id: true,
      statusCliente: true,
      compradorNome: true,
      compradorTelefone: true,
      logradouro: true,
      numero: true,
      complemento: true,
      bairro: true,
      cidade: true,
      uf: true,
      cep: true,
      total: true,
      frete: true,
      criadoEm: true,
      items: {
        select: {
          nomeProduto: true,
          quantidade: true,
          preco: true,
          imagemProduto: true,
        },
      },
    },
  });

  return NextResponse.json(
    pedidos.map(p => ({
      ...p,
      total: parseFloat(p.total.toString()),
      frete: parseFloat(p.frete.toString()),
      items: p.items.map(i => ({
        ...i,
        preco: parseFloat(i.preco.toString()),
      })),
    }))
  );
}
