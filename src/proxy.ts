import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const API_ADMIN_PATH = '/api/admin';
const LOGIN_PATH = '/admin/login';

const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? '');

async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as { adminId: string; email: string };
  } catch {
    return null;
  }
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === LOGIN_PATH) {
    return NextResponse.next();
  }

  const token = req.cookies.get('admin-token')?.value;
  const payload = token ? await verifyToken(token) : null;

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

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
