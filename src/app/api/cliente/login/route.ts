import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/src/lib/prisma';
import { comparePassword } from '@/src/lib/password';
import { signClienteJWT } from '@/src/lib/clienteAuth';
import { checkRateLimit } from '@/src/lib/rateLimit';

const LoginSchema = z.object({
  cpf: z.string().regex(/^\d{11}$/, 'CPF deve ter 11 dígitos'),
  pin: z.string().regex(/^\d{4}$/, 'PIN deve ter 4 dígitos'),
});

export async function POST(req: NextRequest) {
  try {
    // 1. Rate Limit
    const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? '127.0.0.1';
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: 'Muitas tentativas. Tente novamente em 15 minutos.' }, { status: 429 });
    }

    // 2. Validação de Body
    const body = await req.json();
    const validation = LoginSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'CPF ou PIN inválidos' }, { status: 401 });
    }

    const { cpf, pin } = validation.data;

    // 3. Busca de Cliente
    const cliente = await prisma.cliente.findUnique({
      where: { cpf, ativo: true },
    });

    // 4. Verificação de PIN (bcrypt)
    // Usar uma senha dummy se o cliente não existir para evitar timing attacks
    const dummyHash = '$2b$12$L7pYlX2f.Q6rY6rY6rY6rY6rY6rY6rY6rY6rY6rY6rY6rY6rY6rY6'; // Hash aleatório
    const isPinValid = await comparePassword(pin, cliente?.pinHash ?? dummyHash);

    if (!cliente || !isPinValid) {
      return NextResponse.json({ error: 'CPF ou PIN inválidos' }, { status: 401 });
    }

    // 5. Gerar JWT
    const token = await signClienteJWT({
      clienteId: cliente.id,
      cpf: cliente.cpf,
    });

    // 6. Resposta com Cookie
    const response = NextResponse.json({
      cliente: {
        id: cliente.id,
        nome: cliente.nome,
        cpf: cliente.cpf,
      }
    });

    response.cookies.set('cliente-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 8, // 8 horas
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('Erro no login de cliente:', error);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}
