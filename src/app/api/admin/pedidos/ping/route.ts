import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireAdmin, unauthorizedResponse } from '@/src/lib/auth';

export async function GET(req: NextRequest) {
  if (!await requireAdmin(req)) return unauthorizedResponse();
  const [total, ultimo] = await Promise.all([
    prisma.order.count(),
    prisma.order.findFirst({
      orderBy: { criadoEm: 'desc' },
      select: { id: true },
    }),
  ]);
  return NextResponse.json({ ultimoId: ultimo?.id ?? null, total });
}
