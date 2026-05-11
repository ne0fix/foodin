import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/src/lib/prisma';
import { requireAdmin, unauthorizedResponse } from '@/src/lib/auth';

type Params = { params: Promise<{ id: string }> };

// GET /api/admin/clientes/[id]
export async function GET(req: NextRequest, { params }: Params) {
  if (!await requireAdmin(req)) return unauthorizedResponse();
  try {
    const { id } = await params;
    const cliente = await prisma.cliente.findUnique({
      where: { id },
      include: {
        enderecos: { orderBy: { principal: 'desc' } },
        pedidos: {
          orderBy: { criadoEm: 'desc' },
          take: 10,
          select: {
            id: true, total: true, status: true,
            statusCliente: true, criadoEm: true,
            metodoPagamento: true, entregaTipo: true,
          },
        },
      },
    });

    if (!cliente) return NextResponse.json({ error: 'Cliente não encontrado.' }, { status: 404 });

    return NextResponse.json({
      ...cliente,
      pinHash: undefined,
      pedidos: cliente.pedidos.map(p => ({
        ...p,
        total: parseFloat(p.total.toString()),
      })),
    });
  } catch (error) {
    console.error('Erro ao buscar cliente:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// PUT /api/admin/clientes/[id]
export async function PUT(req: NextRequest, { params }: Params) {
  if (!await requireAdmin(req)) return unauthorizedResponse();
  try {
    const { id } = await params;
    const body = await req.json();
    const { nome, whatsapp, ativo, pin } = body;

    const data: any = {};
    if (nome     !== undefined) data.nome     = nome.trim();
    if (whatsapp !== undefined) data.whatsapp = whatsapp.replace(/\D/g, '');
    if (ativo    !== undefined) data.ativo    = ativo;
    if (pin      !== undefined) {
      if (String(pin).length !== 4) {
        return NextResponse.json({ error: 'O PIN deve ter 4 dígitos.' }, { status: 400 });
      }
      data.pinHash = await bcrypt.hash(String(pin), 10);
    }

    const cliente = await prisma.cliente.update({ where: { id }, data });
    return NextResponse.json(cliente);
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// DELETE /api/admin/clientes/[id]
export async function DELETE(req: NextRequest, { params }: Params) {
  if (!await requireAdmin(req)) return unauthorizedResponse();
  try {
    const { id } = await params;
    const totalPedidos = await prisma.order.count({ where: { clienteId: id } });

    if (totalPedidos > 0) {
      // Soft delete — mantém histórico de pedidos
      await prisma.cliente.update({ where: { id }, data: { ativo: false } });
    } else {
      await prisma.cliente.delete({ where: { id } });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Erro ao excluir cliente:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
