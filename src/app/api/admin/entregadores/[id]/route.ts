import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireAdmin, unauthorizedResponse } from '@/src/lib/auth';

export async function PATCH(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  if (!await requireAdmin(req)) return unauthorizedResponse();

  const { id } = await props.params;
  const body = await req.json();

  const data: { nome?: string; telefone?: string; ativo?: boolean } = {};
  if (body.nome !== undefined) data.nome = body.nome;
  if (body.telefone !== undefined) data.telefone = String(body.telefone).replace(/\D/g, '');
  if (body.ativo !== undefined) data.ativo = body.ativo;

  try {
    const entregador = await prisma.entregador.update({
      where: { id },
      data,
      select: { id: true, nome: true, telefone: true, ativo: true },
    });
    return NextResponse.json(entregador);
  } catch {
    return NextResponse.json({ error: 'Erro ao atualizar entregador' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  if (!await requireAdmin(req)) return unauthorizedResponse();

  const { id } = await props.params;

  await prisma.entregador.update({
    where: { id },
    data: { ativo: false },
  });

  return NextResponse.json({ ok: true });
}
