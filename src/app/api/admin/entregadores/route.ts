import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/src/lib/prisma';
import { requireAdmin, unauthorizedResponse } from '@/src/lib/auth';

export async function GET(req: NextRequest) {
  if (!await requireAdmin(req)) return unauthorizedResponse();

  const entregadores = await prisma.entregador.findMany({
    orderBy: { criadoEm: 'desc' },
    select: {
      id: true,
      nome: true,
      telefone: true,
      ativo: true,
      criadoEm: true,
      _count: { select: { pedidos: { where: { statusCliente: 'ENTREGUE' } } } },
    },
  });

  return NextResponse.json(
    entregadores.map(e => ({
      id: e.id,
      nome: e.nome,
      telefone: e.telefone,
      ativo: e.ativo,
      criadoEm: e.criadoEm,
      pedidosEntregues: e._count.pedidos,
    }))
  );
}

export async function POST(req: NextRequest) {
  if (!await requireAdmin(req)) return unauthorizedResponse();

  try {
    const { nome, telefone, senha } = await req.json();

    if (!nome || !telefone || !senha) {
      return NextResponse.json({ error: 'Nome, telefone e senha obrigatórios' }, { status: 400 });
    }

    const apenasDigitos = String(telefone).replace(/\D/g, '');
    const senhaHash = await bcrypt.hash(senha, 12);

    const entregador = await prisma.entregador.create({
      data: { nome, telefone: apenasDigitos, senhaHash },
      select: { id: true, nome: true, telefone: true, ativo: true, criadoEm: true },
    });

    return NextResponse.json(entregador, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : '';
    if (msg.includes('Unique constraint')) {
      return NextResponse.json({ error: 'Telefone já cadastrado' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Erro ao criar entregador' }, { status: 500 });
  }
}
