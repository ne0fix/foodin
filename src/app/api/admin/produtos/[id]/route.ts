import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import prisma from '@/src/lib/prisma';
import { produtoToAdminDTO } from '@/src/lib/dto';
import { ProdutoUpdateSchema } from '@/src/utils/validators';
import { requireAdmin, unauthorizedResponse } from '@/src/lib/auth';

const includeCompleto = {
  categoria: true,
  tags: { include: { tag: true } },
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!await requireAdmin(req)) return unauthorizedResponse();
  try {
    const { id } = await params;
    const produto = await prisma.produto.findUnique({ where: { id }, include: includeCompleto });
    if (!produto) return new NextResponse('Produto não encontrado', { status: 404 });
    return NextResponse.json(produtoToAdminDTO(produto));
  } catch (error) {
    console.error('Erro ao buscar produto:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!await requireAdmin(req)) return unauthorizedResponse();
  try {
    const { id } = await params;
    const body = await req.json();
    const validation = ProdutoUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dados inválidos.', details: validation.error.flatten() },
        { status: 400 },
      );
    }

    const { tags, ...data } = validation.data;

    const produto = await prisma.$transaction(async (tx) => {
      if (tags !== undefined) {
        await tx.produtoTag.deleteMany({ where: { produtoId: id } });
      }
      return tx.produto.update({
        where: { id },
        data: {
          ...data,
          ...(tags && {
            tags: { create: tags.map((tagId: string) => ({ tag: { connect: { id: tagId } } })) },
          }),
        },
        include: includeCompleto,
      });
    });

    revalidatePath('/admin/dashboard');
    revalidatePath('/admin/produtos');
    revalidatePath(`/produto/${id}`);
    revalidatePath('/');
    return NextResponse.json(produtoToAdminDTO(produto));
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!await requireAdmin(req)) return unauthorizedResponse();
  try {
    const { id } = await params;
    await prisma.produto.update({ where: { id }, data: { ativo: false } });
    revalidatePath('/admin/dashboard');
    revalidatePath('/admin/produtos');
    revalidatePath(`/produto/${id}`);
    revalidatePath('/');
    revalidatePath('/produtos');
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Erro ao excluir produto:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
