import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/src/lib/prisma';
import { requireAdmin, unauthorizedResponse } from '@/src/lib/auth';

const AddItemSchema = z.object({ produtoId: z.string().min(1) });

// DELETE /api/admin/secoes/[id]/itens?produtoId=xxx
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin(req)) return unauthorizedResponse();
  try {
    const { id: secaoId } = await params;
    const produtoId = req.nextUrl.searchParams.get('produtoId');

    if (!produtoId) {
      return NextResponse.json({ error: 'produtoId é obrigatório.' }, { status: 400 });
    }

    await prisma.secaoItem.delete({
      where: { secaoId_produtoId: { secaoId, produtoId } },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Erro ao remover item da seção:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// POST /api/admin/secoes/[id]/itens
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin(req)) return unauthorizedResponse();
  try {
    const { id: secaoId } = await params;
    const body = await req.json();
    const validation = AddItemSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'produtoId é obrigatório.' }, { status: 400 });
    }

    const { produtoId } = validation.data;

    const produto = await prisma.produto.findUnique({ where: { id: produtoId, ativo: true } });
    if (!produto) return NextResponse.json({ error: 'Produto não encontrado.' }, { status: 404 });

    const existente = await prisma.secaoItem.findUnique({
      where: { secaoId_produtoId: { secaoId, produtoId } },
    });
    if (existente) {
      return NextResponse.json({ error: 'Produto já está nesta seção.' }, { status: 409 });
    }

    const ultimaOrdem = await prisma.secaoItem.count({ where: { secaoId } });

    const item = await prisma.secaoItem.create({
      data: { secaoId, produtoId, ordem: ultimaOrdem },
      include: { produto: { include: { categoria: true, tags: { include: { tag: true } } } } },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Erro ao adicionar item à seção:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
