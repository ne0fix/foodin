import { put } from '@vercel/blob';

const ALLOWED_TYPES = ['image/webp', 'image/jpeg', 'image/png'];
const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

export class BlobUploadError extends Error {
  constructor(
    message: string,
    public statusCode: number,
  ) {
    super(message);
  }
}

export async function uploadImage(file: File): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new BlobUploadError('Formato inválido. Use webp, jpg ou png.', 400);
  }
  if (file.size > MAX_SIZE_BYTES) {
    throw new BlobUploadError('Arquivo muito grande. Máximo 2 MB.', 400);
  }

  const ext = file.type.split('/')[1].replace('jpeg', 'jpg');
  const filename = `produtos/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const blob = await put(filename, file, { access: 'public' });
  return blob.url;
}
