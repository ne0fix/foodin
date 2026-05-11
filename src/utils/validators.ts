import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email({ message: 'Por favor, insira um e-mail válido.' }),
  senha: z.string().min(6, { message: 'A senha deve ter no mínimo 6 caracteres.' }),
});

export type LoginFormData = z.infer<typeof LoginSchema>;

// --- Produto Schemas ---

export const ProdutoCreateSchema = z.object({
  nome: z.string().min(3, 'O nome deve ter no mínimo 3 caracteres.'),
  descricao: z.string().min(10, 'A descrição deve ter no mínimo 10 caracteres.'),
  preco: z.number().positive('O preço deve ser um número positivo.'),
  precoOriginal: z.number().positive('O preço original deve ser positivo.').nullable().optional(),
  imagem: z.string().min(1, 'A imagem é obrigatória.'),
  imagens: z.array(z.string().url().or(z.string().startsWith('/'))).max(4, 'Máximo 4 imagens adicionais.').default([]),
  quantidadePacote: z.string().min(1, 'A quantidade do pacote é obrigatória.'),
  categoriaId: z.string().min(1, 'A categoria é obrigatória.'),
  emEstoque: z.boolean().default(true),
  estoqueQuantidade: z.number().int().min(-1).default(-1),
  tags: z.array(z.string()).default([]),
});

export const ProdutoUpdateSchema = ProdutoCreateSchema.partial();

export type ProdutoFormData = z.infer<typeof ProdutoCreateSchema>;


// --- Estoque Schema ---
export const EstoqueUpdateSchema = z.object({
  emEstoque: z.boolean(),
  estoqueQuantidade: z.number().int().min(-1).optional(),
});


// --- Categoria Schemas ---

export const CategoriaCreateSchema = z.object({
  id: z.string().min(3, 'O ID deve ter no mínimo 3 caracteres (ex: "hortifruti").'),
  nome: z.string().min(3, 'O nome deve ter no mínimo 3 caracteres.'),
  icone: z.string().min(1, 'O ícone é obrigatório (pode ser um emoji).'),
  ordem: z.coerce.number().optional(),
});

export const CategoriaUpdateSchema = z.object({
  nome: z.string().min(3).optional(),
  icone: z.string().min(1).optional(),
  ordem: z.coerce.number().optional(),
  ativo: z.boolean().optional(),
});

export type CategoriaUpdateData = z.infer<typeof CategoriaUpdateSchema>;

// --- Seção Schemas ---

export const SecaoCreateSchema = z.object({
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/, 'Apenas letras minúsculas, números e hífens.'),
  titulo: z.string().min(3, 'O título deve ter no mínimo 3 caracteres.'),
  subtitulo: z.string().optional().nullable(),
  maxItens: z.coerce.number().min(1).max(20).default(8),
  modoSelecao: z.enum(['AUTOMATICO', 'MANUAL']).default('AUTOMATICO'),
  filtroCategoriaId: z.string().optional().nullable(),
  filtroTag: z.string().optional().nullable(),
  ordem: z.coerce.number().optional().default(0),
});

export type SecaoCreateData = z.infer<typeof SecaoCreateSchema>;

export const SecaoUpdateSchema = z.object({
  titulo: z.string().min(3, 'O título deve ter no mínimo 3 caracteres.').optional(),
  subtitulo: z.string().optional().nullable(),
  ativo: z.boolean().optional(),
  maxItens: z.coerce.number().min(1).max(20).optional(),
  filtroCategoriaId: z.string().optional().nullable(),
  filtroTag: z.string().optional().nullable(),
  modoSelecao: z.enum(['AUTOMATICO', 'MANUAL']).optional(),
});

export type SecaoUpdateData = z.infer<typeof SecaoUpdateSchema>;

export const OrdemItensSchema = z.array(
  z.object({ produtoId: z.string(), ordem: z.coerce.number() }),
);

export function validarCPF(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) return false;
  if (/^(\d)\1+$/.test(digits)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i);
  let check = (sum * 10) % 11;
  if (check === 10 || check === 11) check = 0;
  if (check !== parseInt(digits[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i);
  check = (sum * 10) % 11;
  if (check === 10 || check === 11) check = 0;
  return check === parseInt(digits[10]);
}

export function formatarCPF(cpf: string): string {
  const d = cpf.replace(/\D/g, '').slice(0, 11);
  return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

export function formatarTelefone(tel: string): string {
  const d = tel.replace(/\D/g, '').slice(0, 11);
  if (d.length === 11) return d.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  return d.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
}
