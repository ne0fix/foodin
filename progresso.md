# PROGRESSO DE IMPLEMENTAÇÃO — Ekomart Fullstack

Última atualização: 2026-05-08

## Fase Atual: Fase 6 — Finalização + Deploy

## ✅ Concluído

### Fase 1 — Banco + BFF público
- [x] prisma/schema.prisma
- [x] prisma/seed.ts
- [x] src/lib/prisma.ts
- [x] src/lib/dto.ts (+ filtroCategoriaId/filtroTag em SecaoHomeDTO + secaoToAdminDTO)
- [x] src/app/api/produtos/route.ts
- [x] src/app/api/produtos/[id]/route.ts
- [x] src/app/api/categorias/route.ts
- [x] src/app/api/home/secoes/route.ts
- [x] src/services/api/produto.api.ts (migrado para fetch)
- [x] src/viewmodels/home.vm.ts
- [x] src/viewmodels/categorias.vm.ts
- [x] src/app/page.tsx (dinâmico via API)

### Fase 2 — Auth + Middleware
- [x] src/lib/auth.ts
- [x] src/lib/password.ts
- [x] src/lib/rateLimit.ts
- [x] src/app/api/auth/login/route.ts
- [x] src/app/api/auth/logout/route.ts
- [x] src/app/api/auth/me/route.ts
- [x] middleware.ts
- [x] src/app/admin/login/page.tsx

### Fase 3 — CRUD Admin de Produtos
- [x] src/utils/validators.ts (+ CategoriaUpdateSchema, SecaoCreateSchema, OrdemItensSchema)
- [x] src/app/api/admin/produtos/route.ts
- [x] src/app/api/admin/produtos/[id]/route.ts
- [x] src/app/api/admin/produtos/[id]/estoque/route.ts
- [x] src/app/admin/layout.tsx
- [x] src/components/admin/AdminSidebar.tsx
- [x] src/components/admin/AdminTopBar.tsx
- [x] src/app/admin/dashboard/page.tsx
- [x] src/components/admin/ui/DataTable.tsx
- [x] src/components/admin/ui/Toggle.tsx
- [x] src/components/admin/ui/ConfirmDialog.tsx
- [x] src/components/admin/ui/Badge.tsx
- [x] src/components/admin/TagSelector.tsx
- [x] src/components/admin/ProdutoForm.tsx
- [x] src/app/admin/produtos/page.tsx
- [x] src/app/admin/produtos/novo/page.tsx
- [x] src/app/admin/produtos/[id]/page.tsx

### Fase 4 — Upload de Imagem
- [x] src/app/api/admin/upload/route.ts
- [x] src/components/admin/ImageUpload.tsx
- [x] src/components/admin/ProdutoForm.tsx (com ImageUpload)

### Fase 5 — Categorias + Seções Admin ✅ CONCLUÍDA
- [x] src/app/api/admin/categorias/[id]/route.ts (PUT + DELETE com bloqueio 409)
- [x] src/app/api/admin/secoes/route.ts (GET com produtosPrevia + POST)
- [x] src/app/api/admin/secoes/[id]/route.ts (GET + PUT + DELETE)
- [x] src/app/api/admin/secoes/[id]/toggle/route.ts (PATCH ativo)
- [x] src/app/api/admin/secoes/[id]/itens/route.ts (POST)
- [x] src/app/api/admin/secoes/[id]/itens/[produtoId]/route.ts (DELETE)
- [x] src/app/api/admin/secoes/[id]/ordem/route.ts (PUT via $transaction)
- [x] src/components/admin/SecaoPreviaProdutos.tsx
- [x] src/components/admin/ui/DragList.tsx (up/down buttons)
- [x] src/components/admin/SecaoCard.tsx (AUTOMATICO + MANUAL + prévia)
- [x] src/app/admin/categorias/page.tsx (tabela inline editável)
- [x] src/app/admin/secoes/page.tsx (lista de SecaoCard com reordenação)

### Fase 6 — Finalização + Deploy ✅ CÓDIGO CONCLUÍDO
- [x] src/lib/blob.ts (abstração Vercel Blob)
- [x] Cache HTTP nas rotas públicas (Cache-Control em todas as 4 rotas públicas)
- [x] next.config.ts: domínio *.public.blob.vercel-storage.com configurado
- [x] Verificar que nenhum arquivo fora do seed importa de src/mocks/
- [x] Tipos TypeScript: zero `any` implícito no código de produção

### Correções pós-infra (2026-05-08)
- [x] Middleware migrado para `src/proxy.ts` (Next.js 16: arquivo renomeado de middleware → proxy)
- [x] JWT migrado de `jsonwebtoken` → `jose` (compatível com Edge Runtime)
- [x] Smoke test e2e: todas as rotas públicas retornam 200, todas as rotas admin retornam 401 sem auth e 200 com auth

## ⏳ Pendente

- [ ] Configurar BLOB_READ_WRITE_TOKEN real no .env.local (atual é placeholder) para habilitar upload de imagens
- [ ] Deploy na Vercel com variáveis de produção

## ❌ Bloqueios / Dúvidas
- Executar `prisma migrate dev` e `prisma db seed` requer DATABASE_URL configurada pelo usuário.
- BLOB_READ_WRITE_TOKEN precisa ser configurado no .env.local para upload de imagens funcionar.
