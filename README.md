# foodin 🍔

Plataforma de delivery de comida estilo iFood — cardápio online, carrinho, checkout com Pix e cartão, painel admin e gestão de pedidos.

Construído com **Next.js 15 App Router**, **Prisma 5 + PostgreSQL (Neon)**, **Tailwind CSS 4** e integração com **Mercado Pago**.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 15 (App Router, React 19) |
| Banco de dados | PostgreSQL via Neon (serverless) |
| ORM | Prisma 5 |
| Estilo | Tailwind CSS 4 |
| Pagamentos | Mercado Pago (PIX + Cartão) |
| Imagens | Vercel Blob |
| Auth | JWT (httpOnly cookies) |

---

## Funcionalidades

- **Vitrine pública** — cardápio com categorias, busca, filtros e página de detalhe do prato
- **Carrinho** — persistido em `localStorage`, atualização de quantidades em tempo real
- **Checkout** — endereço de entrega ou retirada, pagamento via Mercado Pago Brick
- **Pedidos** — confirmação, acompanhamento e histórico por cliente
- **Painel Admin** — gestão de produtos, categorias, pedidos, estoque e seções da home
- **Webhooks** — notificações de pagamento do Mercado Pago

---

## Variáveis de ambiente

Crie um `.env.local` baseado no `.env.example`:

```env
DATABASE_URL="postgresql://USER:PASS@HOST/neondb?sslmode=require"
JWT_SECRET="string-aleatoria-min-32-chars"
BLOB_READ_WRITE_TOKEN="token-do-vercel-blob"
ADMIN_EMAIL_SEED="admin@seudominio.com"
ADMIN_SENHA_SEED="SenhaForte@2026"

# Mercado Pago
MP_ACCESS_TOKEN="APP_USR-..."
NEXT_PUBLIC_MP_PUBLIC_KEY="APP_USR-..."
MP_WEBHOOK_SECRET="seu-webhook-secret"

# Frete
FRETE_GRATIS_ACIMA="200"
NEXT_PUBLIC_FRETE_GRATIS_ACIMA="200"

# App
NEXT_PUBLIC_APP_URL="https://seudominio.com"
NEXT_PUBLIC_NOME_APP="foodin"
NEXT_PUBLIC_TEMPO_ENTREGA_PADRAO="30-45 min"
NEXT_PUBLIC_LOJA_TELEFONE="(XX) XXXXX-XXXX"
NEXT_PUBLIC_LOJA_ENDERECO="Rua Example, 100 — Cidade, UF"
NEXT_PUBLIC_LOJA_HORARIO="Seg–Sex 8h–20h · Sáb 8h–18h"
```

---

## Rodando localmente

**Pré-requisito:** Node.js 20+

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env.local
# edite .env.local com suas credenciais

# 3. Aplicar migrations e popular banco
npx prisma migrate deploy
npx prisma db seed

# 4. Iniciar servidor de desenvolvimento
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

Admin em [http://localhost:3000/admin](http://localhost:3000/admin).

---

## Deploy (Vercel)

```bash
vercel --prod
```

Configure as variáveis de ambiente no dashboard da Vercel antes do deploy.
