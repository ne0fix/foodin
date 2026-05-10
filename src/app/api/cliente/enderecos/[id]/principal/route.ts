import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const clienteId = req.headers.get('X-Cliente-Id');
  if (!clienteId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { id } = await params;

  try {
    // Verificar propriedade
    const endereco = await prisma.endereco.findUnique({ where: { id } });
    if (!endereco || endereco.clienteId !== clienteId) {
      return NextResponse.json({ error: 'Endereço não encontrado' }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Desmarcar todos os endereços do cliente como principal
      await tx.endereco.updateMany({
        where: { clienteId, principal: true },
        data: { principal: false },
      });

      // 2. Marcar o endereço específico como principal
      await tx.endereco.update({
        where: { id },
        data: { principal: true },
      });
    });

    return NextResponse.json({ message: 'Endereço principal atualizado' });

  } catch (error) {
    console.error('Erro ao definir endereço principal:', error);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}
