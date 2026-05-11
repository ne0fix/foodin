import { put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, unauthorizedResponse } from '@/src/lib/auth';

export const maxDuration = 30; // aumenta timeout para 30s (evita cold start timeout)

const ALLOWED_TYPES = ['image/webp', 'image/jpeg', 'image/png', 'image/gif'];
const MAX_SIZE = 4.5 * 1024 * 1024; // 4.5 MB

function sanitizeFilename(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase().replace('jpg', 'jpeg') ?? 'png';
  const safe = name
    .replace(/\.[^.]+$/, '')           // remove extensão
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')   // remove acentos
    .replace(/[^a-zA-Z0-9-_]/g, '-')  // substitui caracteres especiais
    .replace(/-+/g, '-')               // colapsa múltiplos hífens
    .slice(0, 40)                      // limita tamanho
    .toLowerCase();
  const timestamp = Date.now();
  const rand = Math.random().toString(36).slice(2, 7);
  return `produtos/${timestamp}-${rand}-${safe}.${ext}`;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!await requireAdmin(request)) return unauthorizedResponse();
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');

  if (!filename) {
    return NextResponse.json({ message: 'Nome do arquivo não fornecido.' }, { status: 400 });
  }

  if (!request.body) {
    return NextResponse.json({ message: 'Nenhum arquivo no corpo da requisição.' }, { status: 400 });
  }

  // Validar Content-Type
  const contentType = request.headers.get('content-type') ?? '';
  const mimeBase = contentType.split(';')[0].trim();
  if (ALLOWED_TYPES.length > 0 && mimeBase && !ALLOWED_TYPES.includes(mimeBase)) {
    return NextResponse.json(
      { message: `Formato inválido: ${mimeBase}. Use PNG, JPG, WEBP ou GIF.` },
      { status: 400 },
    );
  }

  // Validar tamanho pelo Content-Length (quando disponível)
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > MAX_SIZE) {
    return NextResponse.json(
      { message: 'Arquivo muito grande. Máximo 4.5 MB.' },
      { status: 400 },
    );
  }

  const pathname = sanitizeFilename(filename);

  try {
    const blob = await put(pathname, request.body, {
      access: 'public',
      addRandomSuffix: false, // já geramos nome único no sanitizeFilename
    });

    return NextResponse.json({ url: blob.url, pathname: blob.pathname });

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[upload] Erro Vercel Blob:', msg);

    // Retry automático para erros de timeout/network transientes
    if (msg.includes('timeout') || msg.includes('network') || msg.includes('fetch')) {
      try {
        // Re-lê o body (pode já ter sido consumido, então tentamos de outra forma)
        return NextResponse.json(
          { message: 'Tempo de resposta excedido. Tente novamente.' },
          { status: 503 },
        );
      } catch { /* ignore */ }
    }

    return NextResponse.json(
      { message: 'Erro ao fazer upload. Tente novamente.', detail: msg },
      { status: 500 },
    );
  }
}
