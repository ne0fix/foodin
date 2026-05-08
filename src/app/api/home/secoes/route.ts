import { NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';
import {
  produtoToDTO,
  secaoToDTO,
  ProdutoPublicoDTO,
} from '@/src/lib/dto';
import { Prisma } from '@prisma/client';

export async function GET() {
  try {
    const secoes = await prisma.secao.findMany({
      where: { ativo: true },
      orderBy: { ordem: 'asc' },
      include: {
        itens: {
          where: { produto: { ativo: true } },
          orderBy: { ordem: 'asc' },
          include: {
            produto: {
              include: {
                categoria: true,
                tags: { include: { tag: true } },
              },
            },
          },
        },
      },
    });

    const secoesHomeDTO = await Promise.all(
      secoes.map(async (secao) => {
        let produtosDTO: ProdutoPublicoDTO[] = [];

        if (secao.modoSelecao === 'MANUAL') {
          const itensLimitados = secao.itens.slice(0, secao.maxItens);
          produtosDTO = itensLimitados
            .map((item) => item.produto)
            .map(produtoToDTO);
        } else {
          // AUTOMATICO
          const where: Prisma.ProdutoWhereInput = { ativo: true };
          if (secao.filtroCategoriaId) {
            where.categoriaId = secao.filtroCategoriaId;
          }
          if (secao.filtroTag) {
            where.tags = { some: { tagId: secao.filtroTag } };
          }

          const produtos = await prisma.produto.findMany({
            where,
            take: secao.maxItens,
            orderBy: { criadoEm: 'desc' },
            include: {
              categoria: true,
              tags: { include: { tag: true } },
            },
          });
          produtosDTO = produtos.map(produtoToDTO);
        }

        return secaoToDTO(secao, produtosDTO);
      })
    );

    return NextResponse.json(secoesHomeDTO, {
      headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' },
    });
  } catch (error) {
    console.error('Erro ao buscar seções da home:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
