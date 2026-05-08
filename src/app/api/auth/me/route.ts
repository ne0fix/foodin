import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromRequest } from '@/src/lib/auth';
import prisma from '@/src/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const adminPayload = await getAdminFromRequest(req);

    if (!adminPayload) {
      return new NextResponse('Não autorizado.', { status: 401 });
    }

    const admin = await prisma.admin.findUnique({
      where: { id: adminPayload.adminId },
      select: {
        id: true,
        email: true,
        nome: true,
        criadoEm: true,
        atualizadoEm: true,
      }
    });

    if (!admin) {
        const response = new NextResponse('Não autorizado. O admin pode ter sido removido.', { status: 401 });
        response.cookies.set('admin-token', '', { maxAge: 0, path: '/' });
        return response;
    }


    return NextResponse.json({ admin });

  } catch (error) {
    console.error('Erro ao buscar dados do admin:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
