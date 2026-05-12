import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/src/lib/prisma';
import { signEntregadorJWT } from '@/src/lib/entregadorAuth';

export async function POST(req: NextRequest) {
  try {
    const { telefone, senha } = await req.json();

    if (!telefone || !senha) {
      return NextResponse.json({ error: 'Telefone e senha obrigatórios' }, { status: 400 });
    }

    const apenasDigitos = String(telefone).replace(/\D/g, '');
    const entregador = await prisma.entregador.findUnique({
      where: { telefone: apenasDigitos },
    });

    if (!entregador || !entregador.ativo) {
      return NextResponse.json({ error: 'Telefone ou senha inválidos' }, { status: 401 });
    }

    const senhaValida = await bcrypt.compare(senha, entregador.senhaHash);
    if (!senhaValida) {
      return NextResponse.json({ error: 'Telefone ou senha inválidos' }, { status: 401 });
    }

    const token = await signEntregadorJWT({
      entregadorId: entregador.id,
      telefone: entregador.telefone,
    });

    const response = NextResponse.json({
      id: entregador.id,
      nome: entregador.nome,
      telefone: entregador.telefone,
    });

    response.cookies.set('entregador-token', token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 28800,
      path: '/',
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
