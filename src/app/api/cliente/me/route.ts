import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

export async function GET(req: NextRequest) {
  const clienteId = req.headers.get('X-Cliente-Id');
  
  if (!clienteId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteId },
      select: {
        id: true,
        nome: true,
        cpf: true,
        whatsapp: true,
        criadoEm: true,
        enderecos: {
          orderBy: { principal: 'desc' },
        },
      },
    });

    if (!cliente) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    return NextResponse.json(cliente);

  } catch (error) {
    console.error('Erro ao buscar perfil do cliente:', error);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}
