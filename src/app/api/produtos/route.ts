import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/src/lib/prisma';
import { produtoToDTO } from '@/src/lib/dto';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const categoria = searchParams.get('categoria');
    const tag = searchParams.get('tag');
    const q = searchParams.get('q');
    const emEstoqueParam = searchParams.get('emEstoque');

    const where: Prisma.ProdutoWhereInput = {
      ativo: true,
    };

    if (categoria) {
      where.categoriaId = categoria;
    }

    if (tag) {
      where.tags = {
        some: {
          tagId: tag,
        },
      };
    }

    if (q) {
      where.OR = [
        { nome: { contains: q, mode: 'insensitive' } },
        { descricao: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (emEstoqueParam) {
      where.emEstoque = emEstoqueParam === 'true';
    }

    const produtos = await prisma.produto.findMany({
      where,
      include: {
        categoria: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
      orderBy: {
        criadoEm: 'desc',
      },
    });

    const produtosDTO = produtos.map(produtoToDTO);

    return NextResponse.json(produtosDTO, {
      headers: { 'Cache-Control': 's-maxage=30, stale-while-revalidate=120' },
    });
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
