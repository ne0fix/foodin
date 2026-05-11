import { NextResponse } from 'next/server';
import prisma from '@/src/lib/prisma';
import { produtoToDTO, secaoToDTO, ProdutoPublicoDTO } from '@/src/lib/dto';
import { Prisma } from '@prisma/client';

const incluirProduto = {
  categoria: true,
  tags: { include: { tag: true } },
} as const;

export async function GET() {
  try {
    // 1. Busca metadados das seções sem incluir itens
    const secoes = await prisma.secao.findMany({
      where: { ativo: true },
      orderBy: { ordem: 'asc' },
    });

    const manuaisIds  = secoes.filter(s => s.modoSelecao === 'MANUAL').map(s => s.id);
    const automaticas = secoes.filter(s => s.modoSelecao === 'AUTOMATICO');

    // 2. Uma única query para todos os itens de seções manuais
    const itensManual = manuaisIds.length > 0
      ? await prisma.secaoItem.findMany({
          where: { secaoId: { in: manuaisIds }, produto: { ativo: true } },
          orderBy: { ordem: 'asc' },
          include: { produto: { include: incluirProduto } },
        })
      : [];

    const itensMap = new Map<string, typeof itensManual>();
    for (const item of itensManual) {
      const lista = itensMap.get(item.secaoId) ?? [];
      lista.push(item);
      itensMap.set(item.secaoId, lista);
    }

    // 3. Queries paralelas para seções automáticas (já era paralelo com Promise.all,
    //    mas agora não carrega itens desnecessários na query principal)
    const produtosAutomaticas = await Promise.all(
      automaticas.map(secao => {
        const where: Prisma.ProdutoWhereInput = { ativo: true };
        if (secao.filtroCategoriaId) where.categoriaId = secao.filtroCategoriaId;
        if (secao.filtroTag) where.tags = { some: { tagId: secao.filtroTag } };
        return prisma.produto.findMany({
          where,
          take: secao.maxItens,
          orderBy: { criadoEm: 'desc' },
          include: incluirProduto,
        });
      }),
    );

    const automaticasMap = new Map<string, ProdutoPublicoDTO[]>();
    automaticas.forEach((secao, idx) => {
      automaticasMap.set(secao.id, produtosAutomaticas[idx].map(produtoToDTO));
    });

    // 4. Monta resposta
    const secoesDTO = secoes.map(secao => {
      let produtosDTO: ProdutoPublicoDTO[];

      if (secao.modoSelecao === 'MANUAL') {
        const itens = (itensMap.get(secao.id) ?? []).slice(0, secao.maxItens);
        produtosDTO = itens.map(i => produtoToDTO(i.produto));
      } else {
        produtosDTO = automaticasMap.get(secao.id) ?? [];
      }

      return secaoToDTO(secao, produtosDTO);
    });

    return NextResponse.json(secoesDTO, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('Erro ao buscar seções da home:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
