import { SignJWT, jwtVerify } from 'jose';
import type { NextRequest } from 'next/server';

const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? '');

export interface EntregadorPayload {
  entregadorId: string;
  telefone: string;
}

export async function signEntregadorJWT(payload: EntregadorPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('8h')
    .sign(secret);
}

export async function verifyEntregadorJWT(token: string): Promise<EntregadorPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as EntregadorPayload;
  } catch {
    return null;
  }
}

export async function getEntregadorFromNextRequest(req: NextRequest): Promise<EntregadorPayload | null> {
  const token = req.cookies.get('entregador-token')?.value;
  if (!token) return null;
  return verifyEntregadorJWT(token);
}

export async function requireEntregador(req: NextRequest): Promise<EntregadorPayload | null> {
  return getEntregadorFromNextRequest(req);
}

export function unauthorizedResponse() {
  return new Response(JSON.stringify({ error: 'Não autorizado' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
}
