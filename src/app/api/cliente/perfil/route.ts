import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/src/lib/prisma';

const PerfilSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  whatsapp: z.string().regex(/^\d{10,11}$/, 'WhatsApp inválido'),
});

export async function PUT(req: NextRequest) {
  const clienteId = req.headers.get('X-Cliente-Id');
  
  if (!clienteId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validation = PerfilSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Dados inválidos', 
        details: validation.error.flatten().fieldErrors 
      }, { status: 400 });
    }

    const { nome, whatsapp } = validation.data;

    await prisma.cliente.update({
      where: { id: clienteId },
      data: { nome, whatsapp },
    });

    return NextResponse.json({ message: 'Perfil atualizado com sucesso' });

  } catch (error) {
    console.error('Erro ao atualizar perfil do cliente:', error);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}
