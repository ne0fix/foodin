import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import type { NextRequest } from 'next/server';

const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? '');

export interface ClienteJWTPayload extends JWTPayload {
  clienteId: string;
  cpf: string;
}

export async function signClienteJWT(payload: ClienteJWTPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('8h')
    .setIssuedAt()
    .sign(secret);
}

export async function verifyClienteJWT(token: string): Promise<ClienteJWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as ClienteJWTPayload;
  } catch {
    return null;
  }
}

export async function getClienteFromRequest(req: Request): Promise<ClienteJWTPayload | null> {
  const cookies = req.headers.get('cookie') ?? '';
  const token = cookies.split(';')
    .find(c => c.trim().startsWith('cliente-token='))
    ?.split('=')[1]?.trim();
  if (!token) return null;
  return verifyClienteJWT(token);
}

export async function getClienteFromNextRequest(req: NextRequest): Promise<ClienteJWTPayload | null> {
  const token = req.cookies.get('cliente-token')?.value;
  if (!token) return null;
  return verifyClienteJWT(token);
}
