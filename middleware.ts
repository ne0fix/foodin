import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? '');

async function verifyAdminToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as { adminId: string; email: string };
  } catch { return null; }
}

async function verifyClienteToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as { clienteId: string; cpf: string };
  } catch { return null; }
}

async function verifyEntregadorToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as { entregadorId: string; telefone: string };
  } catch { return null; }
}

const CLIENTE_PUBLIC_PATHS = ['/cliente/login', '/cadastro', '/api/cliente/login', '/api/cliente/cadastrar'];
const ENTREGADOR_PUBLIC_PATHS = ['/entregador/login', '/api/entregador/login'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── Admin ──────────────────────────────────────────────────────────────────
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    if (pathname === '/admin/login') return NextResponse.next();

    const token = req.cookies.get('admin-token')?.value;
    const payload = token ? await verifyAdminToken(token) : null;

    if (!payload) {
      if (pathname.startsWith('/api/admin'))
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }

    const headers = new Headers(req.headers);
    headers.set('X-Admin-Id', payload.adminId);
    return NextResponse.next({ request: { headers } });
  }

  // ── Cliente ────────────────────────────────────────────────────────────────
  const isClientePublic = CLIENTE_PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'));
  const isClienteProtected = pathname.startsWith('/cliente') || pathname.startsWith('/api/cliente');

  if (isClienteProtected && !isClientePublic) {
    const token = req.cookies.get('cliente-token')?.value;
    const payload = token ? await verifyClienteToken(token) : null;

    if (!payload) {
      if (pathname.startsWith('/api/cliente'))
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
      const url = new URL('/cliente/login', req.url);
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }

    const headers = new Headers(req.headers);
    headers.set('X-Cliente-Id', payload.clienteId);
    return NextResponse.next({ request: { headers } });
  }

  // ── Entregador ─────────────────────────────────────────────────────────────
  const isEntregadorPublic = ENTREGADOR_PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'));
  const isEntregadorProtected = pathname.startsWith('/entregador') || pathname.startsWith('/api/entregador');

  if (isEntregadorProtected && !isEntregadorPublic) {
    const token = req.cookies.get('entregador-token')?.value;
    const payload = token ? await verifyEntregadorToken(token) : null;

    if (!payload) {
      if (pathname.startsWith('/api/entregador'))
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
      const url = new URL('/entregador/login', req.url);
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }

    const headers = new Headers(req.headers);
    headers.set('X-Entregador-Id', payload.entregadorId);
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
    '/entregador/:path*',
    '/api/entregador/:path*',
  ],
};
