import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/src/lib/prisma';

const EnderecoSchema = z.object({
  apelido:    z.string().min(1, 'Apelido é obrigatório'),
  cep:        z.string().regex(/^\d{8}$/, 'CEP inválido'),
  logradouro: z.string().min(1, 'Logradouro é obrigatório'),
  numero:     z.string().min(1, 'Número é obrigatório'),
  complemento:z.string().optional().nullable(),
  referencia: z.string().optional().nullable(),
  bairro:     z.string().min(1, 'Bairro é obrigatório'),
  cidade:     z.string().min(1, 'Cidade é obrigatória'),
  uf:         z.string().length(2, 'UF deve ter 2 caracteres'),
  principal:  z.boolean().optional().default(false),
});

export async function GET(req: NextRequest) {
  const clienteId = req.headers.get('X-Cliente-Id');
  if (!clienteId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  try {
    const enderecos = await prisma.endereco.findMany({
      where: { clienteId },
      orderBy: { principal: 'desc' },
    });
    return NextResponse.json({ enderecos });
  } catch (error) {
    console.error('Erro ao listar endereços:', error);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const clienteId = req.headers.get('X-Cliente-Id');
  if (!clienteId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  try {
    const body = await req.json();
    const validation = EnderecoSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Dados inválidos', 
        details: validation.error.flatten().fieldErrors 
      }, { status: 400 });
    }

    const data = validation.data;

    const endereco = await prisma.$transaction(async (tx) => {
      // Se for marcar como principal, desmarcar os outros
      if (data.principal) {
        await tx.endereco.updateMany({
          where: { clienteId, principal: true },
          data: { principal: false },
        });
      }

      return tx.endereco.create({
        data: {
          ...data,
          clienteId,
        },
      });
    });

    return NextResponse.json({ endereco }, { status: 201 });

  } catch (error) {
    console.error('Erro ao criar endereço:', error);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}
