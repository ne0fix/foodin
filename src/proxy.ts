import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const API_ADMIN_PATH = '/api/admin';
const LOGIN_PATH = '/admin/login';

// Rotas de Cliente
const CLIENTE_TOKEN_PATHS = ['/cliente', '/api/cliente/me', '/api/cliente/pedidos',
  '/api/cliente/perfil', '/api/cliente/pin', '/api/cliente/enderecos', '/api/cliente/logout'];
const CLIENTE_PUBLIC_PATHS = ['/cliente/login', '/cadastro',
  '/api/cliente/login', '/api/cliente/cadastrar'];
const CLIENTE_LOGIN_PATH = '/cliente/login';

const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? '');

async function verifyAdminToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as { adminId: string; email: string };
  } catch {
    return null;
  }
}

async function verifyClienteToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as { clienteId: string; cpf: string };
  } catch {
    return null;
  }
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Lógica de Admin
  if (pathname.startsWith('/admin') || pathname.startsWith(API_ADMIN_PATH)) {
    if (pathname === LOGIN_PATH) {
      return NextResponse.next();
    }

    const token = req.cookies.get('admin-token')?.value;
    const payload = token ? await verifyAdminToken(token) : null;

    if (!payload) {
      const isApiRoute = pathname.startsWith(API_ADMIN_PATH);
      if (isApiRoute) {
        return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
      }
      return NextResponse.redirect(new URL(LOGIN_PATH, req.url));
    }

    const headers = new Headers(req.headers);
    headers.set('X-Admin-Id', payload.adminId);
    return NextResponse.next({ request: { headers } });
  }

  // 2. Lógica de Cliente
  const isClientePublic = CLIENTE_PUBLIC_PATHS.some(path => pathname === path || pathname.startsWith(path + '/'));
  const isClienteProtected = pathname.startsWith('/cliente') || pathname.startsWith('/api/cliente');

  if (isClienteProtected && !isClientePublic) {
    const token = req.cookies.get('cliente-token')?.value;
    const payload = token ? await verifyClienteToken(token) : null;

    if (!payload) {
      const isApiRoute = pathname.startsWith('/api/cliente');
      if (isApiRoute) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
      }
      const loginUrl = new URL(CLIENTE_LOGIN_PATH, req.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    const headers = new Headers(req.headers);
    headers.set('X-Cliente-Id', payload.clienteId);
    return NextResponse.next({ request: { headers } });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
    '/cliente/:path*',
    '/api/cliente/:path*',
    '/cadastro',
  ],
};
