import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/src/lib/prisma';

const EnderecoSchema = z.object({
  apelido:    z.string().min(1, 'Apelido é obrigatório').optional(),
  cep:        z.string().regex(/^\d{8}$/, 'CEP inválido').optional(),
  logradouro: z.string().min(1, 'Logradouro é obrigatório').optional(),
  numero:     z.string().min(1, 'Número é obrigatório').optional(),
  complemento:z.string().optional().nullable(),
  referencia: z.string().optional().nullable(),
  bairro:     z.string().min(1, 'Bairro é obrigatório').optional(),
  cidade:     z.string().min(1, 'Cidade é obrigatória').optional(),
  uf:         z.string().length(2, 'UF deve ter 2 caracteres').optional(),
});

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const clienteId = req.headers.get('X-Cliente-Id');
  if (!clienteId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { id } = await params;

  try {
    const body = await req.json();
    const validation = EnderecoSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Dados inválidos', 
        details: validation.error.flatten().fieldErrors 
      }, { status: 400 });
    }

    // Verificar propriedade
    const endereco = await prisma.endereco.findUnique({ where: { id } });
    if (!endereco || endereco.clienteId !== clienteId) {
      return NextResponse.json({ error: 'Endereço não encontrado' }, { status: 404 });
    }

    await prisma.endereco.update({
      where: { id },
      data: validation.data,
    });

    return NextResponse.json({ message: 'Endereço atualizado' });

  } catch (error) {
    console.error('Erro ao atualizar endereço:', error);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const clienteId = req.headers.get('X-Cliente-Id');
  if (!clienteId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { id } = await params;

  try {
    // Verificar propriedade
    const endereco = await prisma.endereco.findUnique({ where: { id } });
    if (!endereco || endereco.clienteId !== clienteId) {
      return NextResponse.json({ error: 'Endereço não encontrado' }, { status: 404 });
    }

    // Não pode remover o último endereço
    const total = await prisma.endereco.count({ where: { clienteId } });
    if (total <= 1) {
      return NextResponse.json({ error: 'Você deve ter pelo menos um endereço cadastrado' }, { status: 400 });
    }

    await prisma.endereco.delete({ where: { id } });

    return NextResponse.json({ message: 'Endereço removido' });

  } catch (error) {
    console.error('Erro ao remover endereço:', error);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}
