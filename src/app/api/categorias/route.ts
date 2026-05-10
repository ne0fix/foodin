import { NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';

export async function GET() {
  try {
    const categorias = await prisma.categoria.findMany({
      where: {
        ativo: true,
      },
      orderBy: {
        ordem: 'asc',
      },
    });

    return NextResponse.json(categorias, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
