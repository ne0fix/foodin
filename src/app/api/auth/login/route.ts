import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/src/lib/prisma';
import { comparePassword } from '@/src/lib/password';
import { signJWT } from '@/src/lib/auth';
import { checkRateLimit } from '@/src/lib/rateLimit';

const LoginSchema = z.object({
  email: z.string().email({ message: 'E-mail inválido.' }),
  senha: z.string().min(6, { message: 'A senha deve ter no mínimo 6 caracteres.' }),
});

export async function POST(req: NextRequest) {
  try {
    // 1. Rate Limiting
    const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? '127.0.0.1';
    if (!checkRateLimit(ip)) {
      return new NextResponse('Muitas tentativas. Tente novamente mais tarde.', { status: 429 });
    }

    // 2. Body Validation
    const body = await req.json();
    const validation = LoginSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Dados de login inválidos.', details: validation.error.flatten() }, { status: 400 });
    }

    const { email, senha } = validation.data;

    // 3. User lookup
    const admin = await prisma.admin.findUnique({
      where: { email },
    });

    if (!admin) {
      return new NextResponse('Credenciais inválidas.', { status: 401 });
    }

    // 4. Password verification
    const isPasswordValid = await comparePassword(senha, admin.senhaHash);

    if (!isPasswordValid) {
      return new NextResponse('Credenciais inválidas.', { status: 401 });
    }

    // 5. JWT generation
    const token = await signJWT({
      adminId: admin.id,
      email: admin.email,
    });

    // 6. Set cookie and send response
    const response = NextResponse.json({
      admin: {
        id: admin.id,
        email: admin.email,
        nome: admin.nome
      }
    });

    response.cookies.set('admin-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 8, // 8 hours
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('Erro no login:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
