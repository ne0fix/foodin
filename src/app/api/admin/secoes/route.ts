import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/src/lib/prisma';
import { secaoToAdminDTO, produtoToDTO, PrismaSecaoCompleta } from '@/src/lib/dto';
import { SecaoCreateSchema } from '@/src/utils/validators';
import { requireAdmin, unauthorizedResponse } from '@/src/lib/auth';

async function resolverPrevia(secao: PrismaSecaoCompleta) {
  if (secao.modoSelecao === 'MANUAL') {
    return secao.itens.slice(0, secao.maxItens).map((i) => produtoToDTO(i.produto));
  }
  const where: Prisma.ProdutoWhereInput = { ativo: true };
  if (secao.filtroCategoriaId) where.categoriaId = secao.filtroCategoriaId;
  if (secao.filtroTag) where.tags = { some: { tagId: secao.filtroTag } };

  const produtos = await prisma.produto.findMany({
    where,
    take: secao.maxItens,
    orderBy: { criadoEm: 'desc' },
    include: { categoria: true, tags: { include: { tag: true } } },
  });
  return produtos.map(produtoToDTO);
}

// GET /api/admin/secoes
export async function GET(req: NextRequest) {
  if (!await requireAdmin(req)) return unauthorizedResponse();
  try {
    const secoes = await prisma.secao.findMany({
      orderBy: { ordem: 'asc' },
      include: {
        itens: {
          orderBy: { ordem: 'asc' },
          include: {
            produto: {
              include: { categoria: true, tags: { include: { tag: true } } },
            },
          },
        },
      },
    });

    const dtos = await Promise.all(
      secoes.map(async (s) => secaoToAdminDTO(s, await resolverPrevia(s))),
    );

    return NextResponse.json(dtos);
  } catch (error) {
    console.error('Erro ao listar seções (admin):', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// POST /api/admin/secoes
export async function POST(req: NextRequest) {
  if (!await requireAdmin(req)) return unauthorizedResponse();
  try {
    const body = await req.json();
    const validation = SecaoCreateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dados inválidos.', details: validation.error.flatten() },
        { status: 400 },
      );
    }

    const { slug, titulo, subtitulo, maxItens, modoSelecao, filtroCategoriaId, filtroTag, ordem } =
      validation.data;

    const secao = await prisma.secao.create({
      data: { slug, titulo, subtitulo, maxItens, modoSelecao, filtroCategoriaId, filtroTag, ordem },
      include: {
        itens: {
          include: { produto: { include: { categoria: true, tags: { include: { tag: true } } } } },
        },
      },
    });

    const previa = await resolverPrevia(secao);
    return NextResponse.json(secaoToAdminDTO(secao, previa), { status: 201 });
  } catch (error: unknown) {
    if ((error as { code?: string }).code === 'P2002') {
      return NextResponse.json({ error: 'Slug já existe.' }, { status: 409 });
    }
    console.error('Erro ao criar seção:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
