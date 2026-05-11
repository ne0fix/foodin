import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';
import { requireAdmin, unauthorizedResponse } from '@/src/lib/auth';

// PATCH /api/admin/secoes/[id]/toggle
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin(req)) return unauthorizedResponse();
  try {
    const { id } = await params;
    const atual = await prisma.secao.findUnique({ where: { id }, select: { ativo: true } });
    if (!atual) return new NextResponse('Seção não encontrada.', { status: 404 });

    const atualizado = await prisma.secao.update({
      where: { id },
      data: { ativo: !atual.ativo },
      select: { id: true, ativo: true },
    });

    return NextResponse.json(atualizado);
  } catch (error) {
    console.error('Erro ao alternar ativo da seção:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
