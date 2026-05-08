import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';
import { EstoqueUpdateSchema } from '@/src/utils/validators';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validation = EstoqueUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dados inválidos.', details: validation.error.flatten() },
        { status: 400 },
      );
    }

    const updated = await prisma.produto.update({
      where: { id },
      data: { emEstoque: validation.data.emEstoque },
    });

    return NextResponse.json({ id: updated.id, emEstoque: updated.emEstoque });
  } catch (error) {
    console.error('Erro ao atualizar estoque:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
