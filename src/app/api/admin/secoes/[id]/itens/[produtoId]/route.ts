import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';
import { requireAdmin, unauthorizedResponse } from '@/src/lib/auth';

// DELETE /api/admin/secoes/[id]/itens/[produtoId]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; produtoId: string }> },
) {
  if (!await requireAdmin(req)) return unauthorizedResponse();
  try {
    const { id: secaoId, produtoId } = await params;

    await prisma.secaoItem.delete({
      where: { secaoId_produtoId: { secaoId, produtoId } },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Erro ao remover item da seção:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
