import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import prisma from '@/src/lib/prisma';
import { CategoriaCreateSchema } from '@/src/utils/validators';
import { Prisma } from '@prisma/client';

// GET /api/admin/categorias
export async function GET() {
    try {
        const categorias = await prisma.categoria.findMany({
            orderBy: {
                ordem: 'asc',
            },
        });
        return NextResponse.json(categorias);
    } catch (error) {
        console.error('Erro ao listar categorias (admin):', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

// POST /api/admin/categorias
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validation = CategoriaCreateSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: 'Dados inválidos.', details: validation.error.flatten() }, { status: 400 });
        }

        const newCategoria = await prisma.categoria.create({
            data: validation.data,
        });

        revalidatePath('/admin/dashboard');
        revalidatePath('/admin/categorias');
        revalidatePath('/');
        revalidatePath('/produtos');
        return NextResponse.json(newCategoria, { status: 201 });

    } catch (error) {
        console.error('Erro ao criar categoria (admin):', error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002') { // Unique constraint violation
                return NextResponse.json({ error: 'Já existe uma categoria com este ID.' }, { status: 409 });
            }
        }
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
