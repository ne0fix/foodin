import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/src/lib/prisma';
import { hashPassword, comparePassword } from '@/src/lib/password';

const PinSchema = z.object({
  pinAtual: z.string().regex(/^\d{4}$/, 'PIN atual deve ter 4 dígitos'),
  pinNovo: z.string().regex(/^\d{4}$/, 'Novo PIN deve ter 4 dígitos'),
  pinNovoConfirmacao: z.string().regex(/^\d{4}$/, 'Confirmação deve ter 4 dígitos'),
}).refine(d => d.pinNovo === d.pinNovoConfirmacao, {
  message: 'PINs não coincidem',
  path: ['pinNovoConfirmacao'],
}).refine(d => d.pinNovo !== d.pinAtual, {
  message: 'Novo PIN deve ser diferente do atual',
  path: ['pinNovo'],
});

export async function PUT(req: NextRequest) {
  const clienteId = req.headers.get('X-Cliente-Id');
  
  if (!clienteId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validation = PinSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Dados inválidos', 
        details: validation.error.flatten().fieldErrors 
      }, { status: 400 });
    }

    const { pinAtual, pinNovo } = validation.data;

    // 1. Buscar cliente
    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteId },
      select: { pinHash: true },
    });

    if (!cliente) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    // 2. Verificar PIN atual
    const isPinValid = await comparePassword(pinAtual, cliente.pinHash);
    if (!isPinValid) {
      return NextResponse.json({ error: 'PIN atual incorreto' }, { status: 400 });
    }

    // 3. Atualizar PIN
    const pinHash = await hashPassword(pinNovo);
    await prisma.cliente.update({
      where: { id: clienteId },
      data: { pinHash },
    });

    return NextResponse.json({ message: 'PIN atualizado com sucesso' });

  } catch (error) {
    console.error('Erro ao trocar PIN do cliente:', error);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}
