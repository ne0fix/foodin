import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

export async function GET(req: NextRequest) {
  const entregadorId = req.headers.get('X-Entregador-Id');
  if (!entregadorId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const entregador = await prisma.entregador.findUnique({
    where: { id: entregadorId },
    select: { id: true, nome: true, telefone: true, ativo: true },
  });

  if (!entregador || !entregador.ativo) {
    return NextResponse.json({ error: 'Entregador não encontrado' }, { status: 404 });
  }

  return NextResponse.json(entregador);
}
