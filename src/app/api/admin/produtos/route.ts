import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
import prisma from '@/src/lib/prisma';
import { produtoToAdminDTO } from '@/src/lib/dto';
import { ProdutoCreateSchema } from '@/src/utils/validators';

// GET /api/admin/produtos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const categoria = searchParams.get('categoria');
    const q = searchParams.get('q');
    const emEstoqueParam = searchParams.get('emEstoque');
    const ativoParam = searchParams.get('ativo');

    // Por padrão mostra apenas ativos; ?ativo=false mostra inativos; ?ativo=all mostra todos
    const where: Prisma.ProdutoWhereInput =
      ativoParam === 'all' ? {} : { ativo: ativoParam === 'false' ? false : true };

    if (categoria) where.categoriaId = categoria;
    if (q) where.OR = [
      { nome: { contains: q, mode: 'insensitive' } },
      { descricao: { contains: q, mode: 'insensitive' } },
    ];
    if (emEstoqueParam) where.emEstoque = emEstoqueParam === 'true';

    const [produtos, total] = await prisma.$transaction([
        prisma.produto.findMany({
            where,
            include: {
                categoria: true,
                tags: { include: { tag: true } },
            },
            orderBy: { atualizadoEm: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.produto.count({ where }),
    ]);

    const produtosDTO = produtos.map(produtoToAdminDTO);

    return NextResponse.json({
      data: produtosDTO,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Erro ao listar produtos (admin):', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// POST /api/admin/produtos
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validation = ProdutoCreateSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: 'Dados inválidos.', details: validation.error.flatten() }, { status: 400 });
        }

        const { tags, ...data } = validation.data;

        const newProduto = await prisma.produto.create({
            data: {
                ...data,
                tags: {
                    create: tags.map((tagId: string) => ({
                        tag: {
                            connect: { id: tagId },
                        },
                    })),
                },
            },
            include: {
                categoria: true,
                tags: { include: { tag: true } },
            },
        });

        revalidatePath('/admin/dashboard');
        revalidatePath('/admin/produtos');
        revalidatePath('/');
        revalidatePath('/produtos');
        return NextResponse.json(produtoToAdminDTO(newProduto), { status: 201 });

    } catch (error) {
        console.error('Erro ao criar produto (admin):', error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            // e.g., foreign key constraint failed
            if (error.code === 'P2025') {
                 return NextResponse.json({ error: 'Erro de relação: A categoria ou tag fornecida não existe.' }, { status: 400 });
            }
        }
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
