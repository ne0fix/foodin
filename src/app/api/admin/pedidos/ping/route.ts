import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

export async function GET() {
  const [total, ultimo] = await Promise.all([
    prisma.order.count(),
    prisma.order.findFirst({
      orderBy: { criadoEm: 'desc' },
      select: { id: true },
    }),
  ]);
  return NextResponse.json({ ultimoId: ultimo?.id ?? null, total });
}
