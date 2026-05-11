import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireAdmin, unauthorizedResponse } from '@/src/lib/auth';

// BRT = UTC-3 (Fortaleza não tem horário de verão)
const BRT_OFFSET = 3 * 60 * 60 * 1000;

function startOfDayBRT(daysAgo = 0): Date {
  const now = new Date();
  const brtNow = new Date(now.getTime() - BRT_OFFSET);
  const midnight = new Date(Date.UTC(
    brtNow.getUTCFullYear(),
    brtNow.getUTCMonth(),
    brtNow.getUTCDate() - daysAgo,
  ));
  // converte de volta para UTC (adiciona offset)
  return new Date(midnight.getTime() + BRT_OFFSET);
}

function buildDateFilter(data: string | undefined) {
  if (!data) return undefined;
  switch (data) {
    case 'hoje':
      return { gte: startOfDayBRT(0) };
    case 'ontem':
      return { gte: startOfDayBRT(1), lt: startOfDayBRT(0) };
    case 'semana':
      return { gte: startOfDayBRT(7) };
    default:
      return undefined;
  }
}

export async function GET(req: NextRequest) {
  if (!await requireAdmin(req)) return unauthorizedResponse();
  const url    = new URL(req.url);
  const page   = parseInt(url.searchParams.get('page') ?? '1');
  const status = url.searchParams.get('status') ?? undefined;
  const data   = url.searchParams.get('data')   ?? undefined;
  const PAGE_SIZE = 20;

  const dateFilter = buildDateFilter(data);
  const where: Record<string, unknown> = {
    ...(status     ? { status }           : {}),
    ...(dateFilter ? { criadoEm: dateFilter } : {}),
  };

  const [total, pedidos] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      orderBy: { criadoEm: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        status: true,
        compradorNome: true,
        compradorEmail: true,
        total: true,
        metodoPagamento: true,
        entregaTipo: true,
        criadoEm: true,
        pagoEm: true,
      },
    }),
  ]);

  return NextResponse.json({
    pedidos: pedidos.map(p => ({
      ...p,
      total: parseFloat(p.total.toString()),
    })),
    total,
    pages: Math.ceil(total / PAGE_SIZE),
    page,
  });
}
