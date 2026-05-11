import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/src/lib/prisma';
import { secaoToAdminDTO, produtoToDTO, PrismaSecaoCompleta } from '@/src/lib/dto';
import { SecaoUpdateSchema } from '@/src/utils/validators';
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

const includeCompleto = {
  itens: {
    orderBy: { ordem: 'asc' as const },
    include: {
      produto: { include: { categoria: true, tags: { include: { tag: true } } } },
    },
  },
};

// GET /api/admin/secoes/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin(req)) return unauthorizedResponse();
  try {
    const { id } = await params;
    const secao = await prisma.secao.findUnique({ where: { id }, include: includeCompleto });
    if (!secao) return new NextResponse('Seção não encontrada.', { status: 404 });

    const previa = await resolverPrevia(secao);
    return NextResponse.json(secaoToAdminDTO(secao, previa));
  } catch (error) {
    console.error('Erro ao buscar seção:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// PUT /api/admin/secoes/[id]
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin(req)) return unauthorizedResponse();
  try {
    const { id } = await params;
    const body = await req.json();
    const validation = SecaoUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dados inválidos.', details: validation.error.flatten() },
        { status: 400 },
      );
    }

    const secao = await prisma.secao.update({
      where: { id },
      data: validation.data,
      include: includeCompleto,
    });

    const previa = await resolverPrevia(secao);
    return NextResponse.json(secaoToAdminDTO(secao, previa));
  } catch (error) {
    console.error('Erro ao atualizar seção:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// DELETE /api/admin/secoes/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin(req)) return unauthorizedResponse();
  try {
    const { id } = await params;
    await prisma.secao.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Erro ao excluir seção:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
