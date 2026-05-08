import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('O segredo JWT (JWT_SECRET) não está definido nas variáveis de ambiente.');
}

const secret = new TextEncoder().encode(JWT_SECRET);

export interface AdminJWTPayload extends JWTPayload {
  adminId: string;
  email: string;
}

export async function signJWT(payload: { adminId: string; email: string }): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(secret);
}

export async function verifyJWT(token: string): Promise<AdminJWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as AdminJWTPayload;
  } catch {
    return null;
  }
}

export async function getAdminFromRequest(req: NextRequest): Promise<AdminJWTPayload | null> {
  const token = req.cookies.get('admin-token')?.value;
  if (token) {
    return verifyJWT(token);
  }
  return null;
}
