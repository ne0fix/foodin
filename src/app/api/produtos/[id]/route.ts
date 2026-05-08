import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';
import { produtoToDTO } from '@/src/lib/dto';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const produto = await prisma.produto.findFirst({
      where: { id, ativo: true },
      include: {
        categoria: true,
        tags: { include: { tag: true } },
      },
    });

    if (!produto) return new NextResponse('Produto não encontrado', { status: 404 });

    return NextResponse.json(produtoToDTO(produto), {
      headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' },
    });
  } catch (error) {
    console.error('Erro ao buscar produto:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
