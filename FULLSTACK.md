# FULLSTACK.md — Especificação Técnica Completa
## Ekomart — Supermercado Online + Painel Admin

**Versão:** 1.0  
**Data:** 2026-05-08  
**Modo:** Arquiteto — sem código funcional  
**Referência base:** PRD-admin.md  

---

## 1. Visão Geral do Projeto

O Ekomart é um supermercado online (genonline.vercel.app) com frontend Next.js 16 já funcional, cujos dados vivem em mocks TypeScript estáticos (`src/mocks/produtos.mock.ts`). O projeto tem ~163 produtos em 7 categorias, 5 páginas públicas e zero persistência real.

Este documento especifica a evolução completa do projeto para uma arquitetura fullstack production-ready com:

- **Frontend público** (já existe, será atualizado para consumir API real)
- **BFF** — Backend For Frontend via Next.js API Routes
- **Painel Admin** — novo, protegido por autenticação
- **Banco PostgreSQL** via Prisma ORM
- **Upload de imagens** via Vercel Blob

---

## 2. Objetivos

| # | Objetivo | Critério de sucesso |
|---|---|---|
| O1 | Eliminar os mocks estáticos | Todos os dados vêm do banco PostgreSQL |
| O2 | Admin gerencia produtos sem deploy | CRUD completo no painel, refletido em tempo real no frontend |
| O3 | Admin configura seções da home | Alterar "Ofertas do Dia" no painel atualiza a home em < 5s |
| O4 | Imagens gerenciadas pelo admin | Upload via painel, URL pública persistida no banco |
| O5 | Autenticação segura | JWT httpOnly, bcrypt, proteção de todas as rotas `/admin/**` |
| O6 | Zero breaking change no frontend público | Páginas existentes continuam funcionando durante e após migração |

---

## 3. Estado Atual do Projeto (As-Is)

### 3.1 Páginas públicas existentes

| Rota | Arquivo | Estado |
|---|---|---|
| `/` | `src/app/page.tsx` | Funcional — filtra mocks em memória |
| `/produtos` | `src/app/produtos/page.tsx` | Funcional — lista + filtro por categoria |
| `/produto/[id]` | `src/app/produto/[id]/page.tsx` | Funcional — detalhe + relacionados |
| `/carrinho` | `src/app/carrinho/page.tsx` | Funcional — estado em memória, perde no reload |

### 3.2 Camadas existentes

| Camada | Arquivo | Responsabilidade |
|---|---|---|
| Model | `src/models/produto.model.ts` | Interfaces TypeScript: Produto, Categoria, ItemCarrinho |
| Mock | `src/mocks/produtos.mock.ts` | 163 produtos + 7 categorias (fonte de dados atual) |
| Service | `src/services/api/produto.api.ts` | Lê dos mocks — será substituído para chamar BFF |
| ViewModel | `src/viewmodels/produtos.vm.ts` | Hooks React: useProdutosViewModel, useProdutoDetailViewModel |
| ViewModel | `src/viewmodels/carrinho.vm.ts` | Estado global em memória com listeners manuais |
| Componentes | `src/components/` | Header, Footer, ProdutoCard, HeroTexto |
| Utils | `src/utils/formatadores.ts` | formatarMoeda (BRL) |
| Estilos | `src/app/globals.css` | Tailwind v4 + paleta green custom + animações |

### 3.3 Problemas do estado atual

- Qualquer alteração de preço exige commit + deploy
- Carrinho perde estado ao recarregar a página
- Seções da home (`ofertas`, `frios`) filtradas por palavras-chave hardcoded
- Imagens em `/public/produtos/` — sem gestão centralizada
- Sem autenticação, sem backend, sem banco

---

## 4. Arquitetura Alvo (To-Be)

```
┌──────────────────────────────────────────────────────────────────┐
│                     Vercel (Deploy)                              │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │               Next.js 16 — App Router                      │  │
│  │                                                            │  │
│  │  ┌─────────────────────┐  ┌──────────────────────────────┐ │  │
│  │  │  FRONTEND PÚBLICO   │  │  PAINEL ADMIN                │ │  │
│  │  │  /                  │  │  /admin/login                │ │  │
│  │  │  /produtos          │  │  /admin/dashboard            │ │  │
│  │  │  /produto/[id]      │  │  /admin/produtos             │ │  │
│  │  │  /carrinho          │  │  /admin/produtos/[id]        │ │  │
│  │  │                     │  │  /admin/categorias           │ │  │
│  │  │  Consome BFF via    │  │  /admin/secoes               │ │  │
│  │  │  fetch() client     │  │  Consome BFF via             │ │  │
│  │  └─────────────────────┘  │  Server Actions ou fetch()   │ │  │
│  │            │               └──────────────────────────────┘ │  │
│  │            │                             │                   │  │
│  │  ┌─────────▼─────────────────────────────▼───────────────┐  │  │
│  │  │                  BFF — API Routes                      │  │  │
│  │  │                  /app/api/                             │  │  │
│  │  │                                                        │  │  │
│  │  │  Públicas:                    Admin (JWT protegidas):  │  │  │
│  │  │  GET /api/produtos            CRUD /api/admin/produtos │  │  │
│  │  │  GET /api/produtos/[id]       CRUD /api/admin/secoes   │  │  │
│  │  │  GET /api/categorias          CRUD /api/admin/categ.   │  │  │
│  │  │  GET /api/home/secoes         POST /api/admin/upload   │  │  │
│  │  │                               POST /api/auth/login     │  │  │
│  │  └───────────────────────┬───────────────────────────────┘  │  │
│  └──────────────────────────┼──────────────────────────────────┘  │
│                             │ Prisma Client                       │
│  ┌──────────────────────────▼──────────────────────────────────┐  │
│  │              PostgreSQL — Neon Serverless                   │  │
│  │  Admin · Produto · Categoria · Tag · Secao · SecaoItem      │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │                Vercel Blob Storage                          │  │
│  │  Imagens de produto — URL pública persistida no banco       │  │
│  └─────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

### 4.1 Princípios arquiteturais

| Princípio | Decisão |
|---|---|
| **Single source of truth** | PostgreSQL é a única fonte de dados — mocks removidos ao final |
| **BFF exclusivo** | Frontend nunca acessa o banco diretamente — só via API Routes |
| **Separação de domínios** | Routes grupos `(public)` vs `admin` vs `api` claramente separados |
| **Zero breaking change** | Contratos de interface TypeScript (Produto, Categoria) se mantêm |
| **Migração incremental** | Fase 1: BFF coexiste com mock → Fase 5: mock removido |

---

## 5. Stack Técnica

### 5.1 Já em uso (manter)

| Tecnologia | Versão | Uso |
|---|---|---|
| Next.js | 16.2.6 | Framework fullstack — App Router + API Routes |
| React | 19.2.6 | Frontend |
| TypeScript | 6.0.3 | Tipagem em todo o projeto |
| Tailwind CSS | 4.2.4 | Estilo — com paleta green custom |
| Lucide React | 1.14.0 | Ícones |
| Motion | 12.38.0 | Animações |
| @hookform/resolvers | 5.2.2 | Validação de formulários |

### 5.2 A adicionar (novas dependências)

| Tecnologia | Versão | Uso |
|---|---|---|
| **Prisma** | ^6.x | ORM — migrations + type-safe queries |
| **@prisma/client** | ^6.x | Client gerado |
| **PostgreSQL** | — | Banco (via Neon ou Supabase) |
| **bcryptjs** | ^2.x | Hash de senhas |
| **@types/bcryptjs** | ^2.x | Tipos |
| **jsonwebtoken** | ^9.x | Geração e verificação de JWT |
| **@types/jsonwebtoken** | ^9.x | Tipos |
| **@vercel/blob** | ^0.x | Upload de imagens |
| **zod** | ^3.x | Validação e parsing de schemas |
| **@dnd-kit/core** | ^6.x | Drag-and-drop nas seções admin |
| **@dnd-kit/sortable** | ^8.x | Sortable list nas seções |

---

## 6. Estrutura de Pastas — Completa

```
ekomart/
│
├── prisma/
│   ├── schema.prisma                  # Schema do banco (7 models)
│   ├── seed.ts                        # Migra mocks → PostgreSQL
│   └── migrations/                    # Histórico de migrations
│
├── src/
│   ├── app/
│   │   ├── globals.css                # Estilos globais (existente)
│   │   ├── layout.tsx                 # Root layout (existente)
│   │   │
│   │   ├── (public)/                  # Grupo de rotas públicas
│   │   │   ├── layout.tsx             # Layout com Header + Footer
│   │   │   ├── page.tsx               # Home — consome /api/home/secoes
│   │   │   ├── produtos/
│   │   │   │   └── page.tsx           # Listagem — consome /api/produtos
│   │   │   ├── produto/
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx       # Detalhe — consome /api/produtos/[id]
│   │   │   └── carrinho/
│   │   │       └── page.tsx           # Carrinho (estado client-side)
│   │   │
│   │   ├── admin/                     # Grupo de rotas protegidas
│   │   │   ├── layout.tsx             # Layout admin: sidebar + topbar
│   │   │   ├── login/
│   │   │   │   └── page.tsx           # Formulário email + senha
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx           # Métricas: produtos, estoque, seções
│   │   │   ├── produtos/
│   │   │   │   ├── page.tsx           # DataTable com filtros
│   │   │   │   ├── novo/
│   │   │   │   │   └── page.tsx       # Formulário de criação
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx       # Formulário de edição
│   │   │   ├── categorias/
│   │   │   │   └── page.tsx           # Tabela inline editável
│   │   │   └── secoes/
│   │   │       └── page.tsx           # Configurador drag-and-drop
│   │   │
│   │   └── api/                       # BFF — API Routes
│   │       │
│   │       ├── produtos/
│   │       │   ├── route.ts           # GET /api/produtos
│   │       │   └── [id]/
│   │       │       └── route.ts       # GET /api/produtos/[id]
│   │       │
│   │       ├── categorias/
│   │       │   └── route.ts           # GET /api/categorias
│   │       │
│   │       ├── home/
│   │       │   └── secoes/
│   │       │       └── route.ts       # GET /api/home/secoes
│   │       │
│   │       ├── auth/
│   │       │   ├── login/
│   │       │   │   └── route.ts       # POST — email+senha → JWT cookie
│   │       │   ├── logout/
│   │       │   │   └── route.ts       # POST — apaga cookie
│   │       │   └── me/
│   │       │       └── route.ts       # GET — retorna admin logado
│   │       │
│   │       └── admin/                 # Todas exigem JWT válido
│   │           ├── produtos/
│   │           │   ├── route.ts       # GET (paginado) + POST
│   │           │   └── [id]/
│   │           │       ├── route.ts   # GET + PUT + DELETE
│   │           │       └── estoque/
│   │           │           └── route.ts  # PATCH toggle emEstoque
│   │           │
│   │           ├── categorias/
│   │           │   ├── route.ts       # GET + POST
│   │           │   └── [id]/
│   │           │       └── route.ts   # PUT + DELETE
│   │           │
│   │           ├── secoes/
│   │           │   ├── route.ts       # GET + POST
│   │           │   └── [id]/
│   │           │       ├── route.ts   # GET + PUT + DELETE
│   │           │       ├── toggle/
│   │           │       │   └── route.ts  # PATCH ativo
│   │           │       ├── itens/
│   │           │       │   ├── route.ts  # POST adicionar produto
│   │           │       │   └── [produtoId]/
│   │           │       │       └── route.ts  # DELETE remover produto
│   │           │       └── ordem/
│   │           │           └── route.ts  # PUT reordenar itens
│   │           │
│   │           └── upload/
│   │               └── route.ts       # POST multipart → Vercel Blob → URL
│   │
│   ├── components/
│   │   ├── Header.tsx                 # Existente (atualizar busca)
│   │   ├── Footer.tsx                 # Existente
│   │   ├── HeroTexto.tsx             # Existente
│   │   ├── ProdutoCard.tsx           # Existente
│   │   │
│   │   └── admin/                    # Componentes exclusivos do admin
│   │       ├── AdminSidebar.tsx       # Navegação lateral
│   │       ├── AdminTopBar.tsx        # Header: breadcrumb + logout
│   │       ├── ProdutoForm.tsx        # Formulário unificado (criar/editar)
│   │       ├── ImageUpload.tsx        # Drag-drop upload + preview
│   │       ├── TagSelector.tsx        # Multi-select chips de tags
│   │       ├── SecaoCard.tsx          # Card de seção (config + prévia)
│   │       ├── SecaoPreviaProdutos.tsx # Grid de prévia dos produtos da seção
│   │       └── ui/
│   │           ├── DataTable.tsx      # Tabela genérica com paginação
│   │           ├── Toggle.tsx         # Switch on/off acessível
│   │           ├── ConfirmDialog.tsx  # Modal de confirmação destructive
│   │           ├── DragList.tsx       # Lista sortable (dnd-kit)
│   │           └── Badge.tsx          # Badge de categoria/tag/status
│   │
│   ├── lib/                          # Utilitários server-side
│   │   ├── prisma.ts                  # Singleton PrismaClient
│   │   ├── auth.ts                    # signJWT, verifyJWT, getAdminFromRequest
│   │   ├── password.ts                # hashPassword, comparePassword (bcrypt)
│   │   ├── blob.ts                    # uploadImage, deleteImage (Vercel Blob)
│   │   └── rateLimit.ts              # Rate limiter simples (login endpoint)
│   │
│   ├── models/
│   │   └── produto.model.ts           # Existente — interfaces TypeScript
│   │
│   ├── services/
│   │   └── api/
│   │       └── produto.api.ts         # Atualizar: mock → fetch('/api/produtos')
│   │
│   ├── viewmodels/
│   │   ├── produtos.vm.ts             # Existente (sem mudança de contrato)
│   │   ├── carrinho.vm.ts             # Existente (sem mudança — fase 1)
│   │   └── home.vm.ts                 # NOVO: consome /api/home/secoes
│   │
│   ├── mocks/
│   │   └── produtos.mock.ts           # Manter até fase 5 (fallback + seed)
│   │
│   └── utils/
│       ├── formatadores.ts            # Existente
│       └── validators.ts              # NOVO: schemas Zod para cada entidade
│
├── middleware.ts                       # Proteção de rotas /admin/** + /api/admin/**
│
├── next.config.ts                      # Atualizar: remover unoptimized, add Blob domain
├── package.json
├── tsconfig.json
├── .env.local                          # DATABASE_URL, JWT_SECRET, BLOB_TOKEN
└── .env.example                        # Template sem valores reais
```

---

## 7. Schema do Banco de Dados

### 7.1 Diagrama de entidades

```
Admin
  id, email, senhaHash, nome, criadoEm, atualizadoEm

Categoria ──< Produto
  id(slug), nome, icone, ordem, ativo

Produto ──< ProdutoTag >── Tag
  id, nome, descricao, preco, precoOriginal, imagem,
  quantidadePacote, emEstoque, avaliacao, numAvaliacoes,
  ativo, categoriaId

Secao ──< SecaoItem >── Produto
  id, slug, titulo, subtitulo, ordem, ativo, maxItens,
  filtroCategoriaId?, filtroTag?, modoSelecao(ENUM)
```

### 7.2 Enums

```
ModoSelecao: AUTOMATICO | MANUAL
```

### 7.3 Índices planejados

| Tabela | Campo(s) | Motivo |
|---|---|---|
| Produto | categoriaId | Filtro por categoria (query mais frequente) |
| Produto | emEstoque | Filtro de disponibilidade |
| Produto | ativo | Soft delete — excluir inativos de queries públicas |
| SecaoItem | secaoId | Join de itens por seção |
| ProdutoTag | tagId | Filtro por tag |

### 7.4 Seed strategy

O arquivo `prisma/seed.ts` executa na ordem:
1. Upsert de `Tag` (ids: desconto, fresco, organico, sem-gluten, sem-lactose)
2. Upsert de `Categoria` (7 slugs dos mocks + campo `ordem`)
3. Upsert de `Produto` para cada item de `mockProdutos` (preserva IDs)
4. Upsert de `ProdutoTag` para cada produto
5. Upsert de `Secao` com configuração inicial das 2 seções da home
6. Insert de `Admin` default (email + senha hasheada com bcrypt)

---

## 8. Fluxos de Dados

### 8.1 Home page — carregamento de seções

```
Browser
  │
  ▼
GET / → src/app/(public)/page.tsx (Server Component ou Client)
  │
  ▼
useHomeSecoesViewModel()           ← src/viewmodels/home.vm.ts
  │  fetch('/api/home/secoes')
  ▼
GET /api/home/secoes               ← src/app/api/home/secoes/route.ts
  │  prisma.secao.findMany({ where: { ativo: true }, orderBy: { ordem: 'asc' } })
  │  Para cada seção:
  │    se AUTOMATICO → filtra produtos por categoriaId e/ou tagId
  │    se MANUAL     → busca SecaoItem ORDER BY ordem LIMIT maxItens
  │  Serializa para ProdutoPublicoDTO[]
  ▼
Response JSON: SecaoComProdutos[]
  │
  ▼
Renderiza seções dinamicamente (sem filtros hardcoded no JSX)
```

### 8.2 Admin — atualizar produto

```
Admin preenche formulário (ProdutoForm)
  │
  ▼
Submit → PUT /api/admin/produtos/[id]   ← src/app/api/admin/produtos/[id]/route.ts
  │  1. middleware.ts verifica JWT cookie → 401 se inválido
  │  2. Zod valida body (validators.ts)
  │  3. prisma.produto.update({ where: { id }, data: { ...body } })
  │  4. Se produto está em seções MANUAL: não altera SecaoItem
  │  5. Se produto estava em seção AUTOMATICO: próxima chamada /api/home/secoes reflete a mudança
  ▼
Response 200: { produto: ProdutoDTO }
  │
  ▼
Frontend admin atualiza estado local (otimistic update ou refetch)
```

### 8.3 Upload de imagem

```
Admin arrasta/seleciona arquivo
  │
  ▼
ImageUpload.tsx valida client-side: tipo (webp|jpg|png), tamanho (≤ 2MB)
  │
  ▼
POST /api/admin/upload (multipart/form-data)  ← src/app/api/admin/upload/route.ts
  │  1. middleware verifica JWT
  │  2. Valida MIME type no servidor (não confiar só no client)
  │  3. Vercel Blob.put(filename, file, { access: 'public' })
  │  4. Retorna URL pública
  ▼
Response: { url: "https://public.blob.vercel-storage.com/..." }
  │
  ▼
ImageUpload seta preview + popula campo imagem do formulário
```

### 8.4 Auth — login do administrador

```
Admin acessa /admin/login
  │
  ▼
Formulário: email + senha → POST /api/auth/login
  │  1. rateLimit: 5 tentativas/IP/15min
  │  2. prisma.admin.findUnique({ where: { email } })
  │  3. bcrypt.compare(senha, senhaHash)
  │  4. Se OK: signJWT({ adminId, email }, expiresIn: '8h')
  │  5. Set-Cookie: admin-token=JWT; HttpOnly; Secure; SameSite=Strict; Max-Age=28800
  ▼
Response 200 → Redirect /admin/dashboard
```

### 8.5 Middleware de proteção

```
Qualquer request para /admin/** ou /api/admin/**
  │
  ▼
middleware.ts
  │  1. Lê cookie admin-token
  │  2. verifyJWT(token, JWT_SECRET)
  │  3. Se inválido/ausente:
  │     - /admin/**     → redirect /admin/login
  │     - /api/admin/** → Response 401 JSON
  │  4. Se válido: injeta adminId no header X-Admin-Id
  ▼
Handler da rota executa normalmente
```

### 8.6 Configurador de Seções — modo manual

```
Admin acessa /admin/secoes
  │
  ▼
GET /api/admin/secoes → lista seções com itens e produtos populados
  │
  ▼
Admin altera modo para MANUAL
  │
  ▼
Campo de busca → GET /api/admin/produtos?q=&limit=10 (autocomplete)
  │
  ▼
Admin seleciona produto → POST /api/admin/secoes/[id]/itens { produtoId }
  │  prisma.secaoItem.create({ data: { secaoId, produtoId, ordem: ultimo+1 } })
  ▼
Prévia atualiza em tempo real (refetch SecaoComProdutos)
  │
  ▼
Admin reordena via drag-and-drop → PUT /api/admin/secoes/[id]/ordem
  │  body: [{ produtoId: 'x', ordem: 0 }, { produtoId: 'y', ordem: 1 }]
  │  prisma.$transaction([...updates de ordem])
  ▼
Próxima chamada /api/home/secoes retorna nova ordem
```

---

## 9. Contratos de API (Tipos TypeScript)

### 9.1 DTOs públicos

```typescript
// Produto retornado pelas rotas públicas
interface ProdutoPublicoDTO {
  id: string
  nome: string
  descricao: string
  preco: number
  precoOriginal: number | null
  imagem: string
  categoria: string
  quantidadePacote: string
  emEstoque: boolean
  avaliacao: number
  numAvaliacoes: number
  tags: string[]
}

// Seção da home com seus produtos
interface SecaoHomeDTO {
  id: string
  slug: string
  titulo: string
  subtitulo: string | null
  ordem: number
  produtos: ProdutoPublicoDTO[]
}

// Categoria pública
interface CategoriaPublicaDTO {
  id: string
  nome: string
  icone: string
  ordem: number
}
```

### 9.2 DTOs admin

```typescript
// Produto com todos os campos admin
interface ProdutoAdminDTO extends ProdutoPublicoDTO {
  ativo: boolean
  categoriaId: string
  criadoEm: string
  atualizadoEm: string
}

// Seção com configuração completa
interface SecaoAdminDTO {
  id: string
  slug: string
  titulo: string
  subtitulo: string | null
  ordem: number
  ativo: boolean
  maxItens: number
  modoSelecao: 'AUTOMATICO' | 'MANUAL'
  filtroCategoriaId: string | null
  filtroTag: string | null
  itens: Array<{ produtoId: string; ordem: number; produto: ProdutoPublicoDTO }>
  produtosPrevia: ProdutoPublicoDTO[]  // resultado real do filtro
}
```

### 9.3 Schemas Zod (validators.ts)

```typescript
// Um schema por entidade, usado em routes e formulários
ProdutoCreateSchema     // POST /api/admin/produtos
ProdutoUpdateSchema     // PUT /api/admin/produtos/[id]
CategoriaCreateSchema   // POST /api/admin/categorias
SecaoUpdateSchema       // PUT /api/admin/secoes/[id]
LoginSchema             // POST /api/auth/login
```

---

## 10. Segurança

| Vetor | Mitigação | Onde |
|---|---|---|
| SQL Injection | Prisma parametriza todas as queries | ORM |
| XSS | Sem dangerouslySetInnerHTML; React escapa por padrão | Frontend |
| CSRF | Cookie SameSite=Strict; métodos POST exigem body JSON | Auth |
| Brute force login | Rate limit 5 req/15min por IP | rateLimit.ts |
| Arquivo malicioso no upload | Validação de MIME no servidor + tamanho máximo 2MB | upload/route.ts |
| Credential leak | JWT em httpOnly cookie (não acessível por JS) | auth.ts |
| Senha em texto claro | bcrypt com salt rounds=12 | password.ts |
| Rota admin acessível | Middleware verifica JWT em TODAS as rotas /admin/** | middleware.ts |

---

## 11. Variáveis de Ambiente

| Variável | Obrigatória | Descrição |
|---|---|---|
| `DATABASE_URL` | Sim | Connection string PostgreSQL (Neon ou Supabase) |
| `JWT_SECRET` | Sim | String aleatória ≥ 32 chars para assinar tokens |
| `BLOB_READ_WRITE_TOKEN` | Sim | Token Vercel Blob para upload de imagens |
| `ADMIN_EMAIL_SEED` | Dev only | Email do admin criado pelo seed |
| `ADMIN_SENHA_SEED` | Dev only | Senha inicial (hasheada antes de persistir) |
| `NODE_ENV` | Auto | production / development |

---

## 12. Lista Completa de Arquivos a Criar

### 12.1 Infraestrutura e banco

| Arquivo | Tipo | Descrição |
|---|---|---|
| `prisma/schema.prisma` | Novo | Schema completo com 7 models |
| `prisma/seed.ts` | Novo | Migra mocks → banco + cria admin default |
| `.env.local` | Novo | Variáveis locais (não versionar) |
| `.env.example` | Novo | Template público sem valores |

### 12.2 Biblioteca server-side (src/lib/)

| Arquivo | Tipo | Descrição |
|---|---|---|
| `src/lib/prisma.ts` | Novo | Singleton PrismaClient (evita múltiplas conexões em dev) |
| `src/lib/auth.ts` | Novo | signJWT, verifyJWT, getAdminFromRequest |
| `src/lib/password.ts` | Novo | hashPassword, comparePassword via bcryptjs |
| `src/lib/blob.ts` | Novo | uploadImage para Vercel Blob, retorna URL |
| `src/lib/rateLimit.ts` | Novo | In-memory rate limiter para endpoint de login |

### 12.3 Validadores

| Arquivo | Tipo | Descrição |
|---|---|---|
| `src/utils/validators.ts` | Novo | Schemas Zod para Produto, Categoria, Secao, Login |

### 12.4 Middleware

| Arquivo | Tipo | Descrição |
|---|---|---|
| `middleware.ts` | Novo | Protege /admin/** e /api/admin/** com verificação JWT |

### 12.5 BFF — Rotas públicas

| Arquivo | Tipo | Descrição |
|---|---|---|
| `src/app/api/produtos/route.ts` | Novo | GET lista produtos ativos com filtros |
| `src/app/api/produtos/[id]/route.ts` | Novo | GET produto por ID |
| `src/app/api/categorias/route.ts` | Novo | GET categorias ativas ordenadas |
| `src/app/api/home/secoes/route.ts` | Novo | GET seções com produtos resolvidos |

### 12.6 BFF — Auth

| Arquivo | Tipo | Descrição |
|---|---|---|
| `src/app/api/auth/login/route.ts` | Novo | POST login → JWT cookie |
| `src/app/api/auth/logout/route.ts` | Novo | POST → apaga cookie |
| `src/app/api/auth/me/route.ts` | Novo | GET admin autenticado |

### 12.7 BFF — Admin (produtos)

| Arquivo | Tipo | Descrição |
|---|---|---|
| `src/app/api/admin/produtos/route.ts` | Novo | GET paginado + POST criar |
| `src/app/api/admin/produtos/[id]/route.ts` | Novo | GET + PUT + DELETE |
| `src/app/api/admin/produtos/[id]/estoque/route.ts` | Novo | PATCH toggle emEstoque |

### 12.8 BFF — Admin (categorias)

| Arquivo | Tipo | Descrição |
|---|---|---|
| `src/app/api/admin/categorias/route.ts` | Novo | GET + POST |
| `src/app/api/admin/categorias/[id]/route.ts` | Novo | PUT + DELETE |

### 12.9 BFF — Admin (seções)

| Arquivo | Tipo | Descrição |
|---|---|---|
| `src/app/api/admin/secoes/route.ts` | Novo | GET + POST |
| `src/app/api/admin/secoes/[id]/route.ts` | Novo | GET + PUT + DELETE |
| `src/app/api/admin/secoes/[id]/toggle/route.ts` | Novo | PATCH ativo |
| `src/app/api/admin/secoes/[id]/itens/route.ts` | Novo | POST adicionar produto |
| `src/app/api/admin/secoes/[id]/itens/[produtoId]/route.ts` | Novo | DELETE remover produto |
| `src/app/api/admin/secoes/[id]/ordem/route.ts` | Novo | PUT reordenar SecaoItem |

### 12.10 BFF — Upload

| Arquivo | Tipo | Descrição |
|---|---|---|
| `src/app/api/admin/upload/route.ts` | Novo | POST multipart → Vercel Blob → URL |

### 12.11 Painel Admin — Páginas

| Arquivo | Tipo | Descrição |
|---|---|---|
| `src/app/admin/layout.tsx` | Novo | Layout admin: AdminSidebar + AdminTopBar |
| `src/app/admin/login/page.tsx` | Novo | Formulário email + senha |
| `src/app/admin/dashboard/page.tsx` | Novo | Cards de métricas + lista recente |
| `src/app/admin/produtos/page.tsx` | Novo | DataTable com filtros e toggle inline |
| `src/app/admin/produtos/novo/page.tsx` | Novo | ProdutoForm modo criação |
| `src/app/admin/produtos/[id]/page.tsx` | Novo | ProdutoForm modo edição |
| `src/app/admin/categorias/page.tsx` | Novo | Tabela inline editável |
| `src/app/admin/secoes/page.tsx` | Novo | Configurador drag-and-drop |

### 12.12 Componentes Admin

| Arquivo | Tipo | Descrição |
|---|---|---|
| `src/components/admin/AdminSidebar.tsx` | Novo | Nav lateral com links + indicador ativo |
| `src/components/admin/AdminTopBar.tsx` | Novo | Breadcrumb + nome admin + logout |
| `src/components/admin/ProdutoForm.tsx` | Novo | Formulário completo react-hook-form + zod |
| `src/components/admin/ImageUpload.tsx` | Novo | Drag-drop + preview + chamada /api/admin/upload |
| `src/components/admin/TagSelector.tsx` | Novo | Multi-select chips para tags |
| `src/components/admin/SecaoCard.tsx` | Novo | Card de seção: config + modo + prévia |
| `src/components/admin/SecaoPreviaProdutos.tsx` | Novo | Grid de prévia dos produtos da seção |
| `src/components/admin/ui/DataTable.tsx` | Novo | Tabela genérica com paginação + sort |
| `src/components/admin/ui/Toggle.tsx` | Novo | Switch acessível (ARIA) |
| `src/components/admin/ui/ConfirmDialog.tsx` | Novo | Modal "Tem certeza?" com ação destructive |
| `src/components/admin/ui/DragList.tsx` | Novo | Lista sortable via @dnd-kit |
| `src/components/admin/ui/Badge.tsx` | Novo | Badge colorido por tipo (categoria/tag/status) |

### 12.13 ViewModels novos / atualizados

| Arquivo | Tipo | Descrição |
|---|---|---|
| `src/viewmodels/home.vm.ts` | Novo | useHomeSecoesViewModel — consome /api/home/secoes |
| `src/services/api/produto.api.ts` | Atualizar | Substituir retorno de mocks por fetch('/api/...') |

### 12.14 Arquivos existentes a modificar

| Arquivo | Modificação |
|---|---|
| `src/app/(public)/page.tsx` | Consumir useHomeSecoesViewModel em vez de filtros hardcoded |
| `src/app/(public)/produtos/page.tsx` | Consumir /api/produtos em vez de mock |
| `src/app/(public)/produto/[id]/page.tsx` | Consumir /api/produtos/[id] |
| `next.config.ts` | Adicionar domínio Vercel Blob em images.remotePatterns |
| `package.json` | Adicionar 8 novas dependências |
| `tsconfig.json` | Adicionar path alias `@/lib/*` |

---

## 13. Plano de Implementação por Fases

### Fase 1 — Banco + BFF público (3–4 dias)
**Entregável:** frontend existente funcionando com dados do banco

- [ ] Instalar Prisma + configurar DATABASE_URL (Neon)
- [ ] Criar `prisma/schema.prisma`
- [ ] `prisma migrate dev --name init`
- [ ] Criar `prisma/seed.ts` e rodar `prisma db seed`
- [ ] Criar `src/lib/prisma.ts` (singleton)
- [ ] Implementar rotas públicas: `/api/produtos`, `/api/categorias`, `/api/home/secoes`
- [ ] Atualizar `produto.api.ts` para consumir BFF
- [ ] Criar `src/viewmodels/home.vm.ts`
- [ ] Atualizar `src/app/page.tsx` para usar home.vm.ts
- [ ] Testar todas as páginas públicas

### Fase 2 — Auth + middleware (1–2 dias)
**Entregável:** login admin funcional, rotas protegidas

- [ ] Criar `src/lib/auth.ts`, `password.ts`, `rateLimit.ts`
- [ ] Implementar `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`
- [ ] Criar `middleware.ts`
- [ ] Criar página `/admin/login`
- [ ] Testar fluxo completo: login → cookie → rota admin → logout

### Fase 3 — CRUD de Produtos no Admin (3–4 dias)
**Entregável:** admin gerencia produtos via painel

- [ ] Criar `src/utils/validators.ts` (schemas Zod)
- [ ] Implementar rotas admin de produtos (GET paginado, POST, PUT, DELETE, PATCH estoque)
- [ ] Criar componentes: DataTable, Toggle, ConfirmDialog, Badge
- [ ] Criar `AdminSidebar`, `AdminTopBar`, layout admin
- [ ] Criar página `/admin/dashboard` (métricas via Prisma count)
- [ ] Criar página `/admin/produtos` com DataTable + toggle inline
- [ ] Criar `ProdutoForm`, `TagSelector`
- [ ] Criar páginas `/admin/produtos/novo` e `/admin/produtos/[id]`

### Fase 4 — Upload de Imagem (1–2 dias)
**Entregável:** admin substitui foto de produto

- [ ] Configurar `@vercel/blob`
- [ ] Criar `src/lib/blob.ts`
- [ ] Implementar `/api/admin/upload`
- [ ] Criar componente `ImageUpload` com drag-drop + preview
- [ ] Integrar ao `ProdutoForm`
- [ ] Atualizar `next.config.ts` com domínio Blob

### Fase 5 — Categorias + Seções Admin (2–3 dias)
**Entregável:** admin configura home sem código

- [ ] Implementar rotas admin de categorias
- [ ] Criar página `/admin/categorias` (tabela inline)
- [ ] Implementar rotas admin de seções (incluindo itens + ordem)
- [ ] Criar componentes: `DragList`, `SecaoCard`, `SecaoPreviaProdutos`
- [ ] Criar página `/admin/secoes` com configurador drag-and-drop
- [ ] Integrar prévia em tempo real

### Fase 6 — Finalização + Limpeza (1–2 dias)
**Entregável:** deploy production sem mocks

- [ ] Remover imports de `mockProdutos` do frontend (manter seed)
- [ ] Adicionar cache HTTP nas rotas públicas (Cache-Control, revalidate)
- [ ] Revisar todos os tipos TypeScript (sem any implícito)
- [ ] Criar `.env.example`
- [ ] Deploy na Vercel com variáveis de produção
- [ ] Smoke test todas as páginas públicas + painel admin

**Total estimado: 11–17 dias de desenvolvimento**

---

## 14. Decisões Técnicas e Justificativas

| Decisão | Alternativas consideradas | Justificativa |
|---|---|---|
| Next.js API Routes como BFF | Express separado, tRPC | Sem infra extra, mesma base de código, deploy único |
| Prisma como ORM | Drizzle, Knex, TypeORM | Melhor DX com Next.js, migrations automáticas, type-safety |
| Neon PostgreSQL | Supabase, PlanetScale | Serverless nativo, conexão pooling built-in, free tier |
| JWT em httpOnly cookie | localStorage, sessionStorage | Imune a XSS por JS; SameSite protege contra CSRF |
| Vercel Blob para imagens | S3, Cloudinary, CDN próprio | Integração nativa Vercel, sem config extra |
| Zod para validação | Yup, Joi, class-validator | Interoperável com react-hook-form, type inference TypeScript |
| @dnd-kit para drag-and-drop | react-beautiful-dnd, react-sortable | Leve, acessível, funciona com React 19 |
| Soft delete (ativo: false) | DELETE físico | Histórico preservado; sem quebrar SecaoItem |
| Rate limit in-memory | Redis, upstash | Sem infra extra para v1; suficiente com Vercel edge |

---

## 15. Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| Seed com dados inconsistentes | Baixa | Alto | Validar cada produto no seed com Zod antes de inserir |
| Vercel Blob indisponível | Muito baixa | Médio | Manter imagem antiga no banco se upload falhar |
| Sessão JWT expirada durante uso | Média | Baixo | Renovação automática no middleware se restam < 30min |
| Query N+1 nas seções da home | Média | Médio | Usar `include` do Prisma em uma única query por seção |
| Conflito de tipos mock vs banco | Baixa | Alto | Manter interfaces TypeScript agnósticas (ProdutoPublicoDTO) |
| Regressão nas páginas públicas | Baixa | Alto | Fase 1 inclui teste de todas as rotas antes de avançar |

---

## 16. Glossário

| Termo | Significado no contexto |
|---|---|
| **BFF** | Backend For Frontend — camada API intermediária entre UI e banco |
| **Mock** | Dado estático TypeScript em `src/mocks/` — fonte atual, a substituir |
| **Seed** | Script que popula o banco com dados iniciais (migração dos mocks) |
| **Seção** | Bloco da home page configurável: título, filtro, produtos exibidos |
| **SecaoItem** | Associação entre Seção e Produto no modo Manual |
| **DTO** | Data Transfer Object — interface de contrato entre API e cliente |
| **Soft delete** | Marcar `ativo: false` em vez de apagar fisicamente do banco |
| **Toggle** | Ação inline de ativar/desativar (ex: emEstoque) sem abrir formulário |
