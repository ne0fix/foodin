import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/src/lib/prisma';
import { requireAdmin, unauthorizedResponse } from '@/src/lib/auth';

// GET /api/admin/clientes?page=1&q=search&ativo=true|false|all
export async function GET(req: NextRequest) {
  if (!await requireAdmin(req)) return unauthorizedResponse();
  try {
    const { searchParams } = req.nextUrl;
    const page  = Math.max(1, parseInt(searchParams.get('page')  || '1'));
    const limit = parseInt(searchParams.get('limit') || '20');
    const q     = searchParams.get('q') ?? '';
    const ativoParam = searchParams.get('ativo');

    const where: any = {};
    if (ativoParam === 'false') where.ativo = false;
    else if (ativoParam !== 'all') where.ativo = true;

    if (q) {
      where.OR = [
        { nome:     { contains: q, mode: 'insensitive' } },
        { cpf:      { contains: q.replace(/\D/g, '') }   },
        { whatsapp: { contains: q.replace(/\D/g, '') }   },
      ];
    }

    const [clientes, total] = await prisma.$transaction([
      prisma.cliente.findMany({
        where,
        orderBy: { criadoEm: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true, nome: true, cpf: true, whatsapp: true,
          ativo: true, criadoEm: true,
          _count: { select: { pedidos: true, enderecos: true } },
        },
      }),
      prisma.cliente.count({ where }),
    ]);

    return NextResponse.json({
      clientes,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Erro ao listar clientes:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// POST /api/admin/clientes
export async function POST(req: NextRequest) {
  if (!await requireAdmin(req)) return unauthorizedResponse();
  try {
    const body = await req.json();
    const { nome, cpf, whatsapp, pin } = body;

    if (!nome?.trim() || !cpf || !whatsapp || !pin) {
      return NextResponse.json({ error: 'Nome, CPF, WhatsApp e PIN são obrigatórios.' }, { status: 400 });
    }
    const cpfDigits = cpf.replace(/\D/g, '');
    if (cpfDigits.length !== 11) {
      return NextResponse.json({ error: 'CPF inválido.' }, { status: 400 });
    }
    if (String(pin).length !== 4) {
      return NextResponse.json({ error: 'O PIN deve ter 4 dígitos.' }, { status: 400 });
    }

    const existe = await prisma.cliente.findUnique({ where: { cpf: cpfDigits } });
    if (existe) {
      return NextResponse.json({ error: 'Já existe um cliente com este CPF.' }, { status: 409 });
    }

    const pinHash = await bcrypt.hash(String(pin), 10);
    const cliente = await prisma.cliente.create({
      data: { nome: nome.trim(), cpf: cpfDigits, whatsapp: whatsapp.replace(/\D/g, ''), pinHash },
    });

    return NextResponse.json(cliente, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar cliente:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
