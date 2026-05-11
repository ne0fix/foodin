# PRD — Super G&N | Plataforma de E-commerce para Supermercado

**Versão:** 1.0  
**Data:** Maio 2026  
**Responsável:** ne0fix  
**Status:** Em desenvolvimento ativo

---

## 1. Visão Geral do Produto

O Super G&N é uma plataforma de e-commerce própria para supermercado localizado em Pacatuba, CE. O objetivo é permitir que clientes façam compras online com entrega ou retirada, processamento de pagamento via PIX ou cartão (MercadoPago), e controle completo pelo administrador via painel web.

### Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16.2.6 (App Router) |
| Frontend | React 19.2.6 + TailwindCSS v4 |
| ORM | Prisma 5.16.2 |
| Banco de dados | PostgreSQL (via Vercel Postgres) |
| Pagamentos | MercadoPago (PIX + CartPayment Brick) |
| Upload | Vercel Blob |
| Deploy | Vercel |
| Auth | JWT customizado (admin: e-mail + senha; cliente: CPF + PIN 4 dígitos) |

### Padrão de Arquitetura

MVVM com Next.js App Router. ViewModels são React hooks em `/src/viewmodels/`. Lógica de negócio fica nas route handlers da API. Serviços externos estão em `/src/services/api/`.

---

## 2. Usuários e Perfis

### 2.1 Cliente Final
- Faz cadastro com nome, CPF e WhatsApp
- Define PIN de 4 dígitos para autenticação
- Navega no catálogo, adiciona ao carrinho, faz checkout
- Acompanha status dos pedidos em área logada

### 2.2 Administrador
- Acesso via e-mail + senha
- Gerencia produtos, categorias, seções da home
- Visualiza e atualiza status de pedidos
- Gerencia clientes cadastrados
- Faz upload de imagens de produtos

---

## 3. Funcionalidades Implementadas

### 3.1 Catálogo de Produtos
- [x] Listagem paginada com filtro por categoria e busca por nome
- [x] Página de detalhe do produto com galeria de imagens
- [x] Tags de produto (ex: "Oferta", "Novo")
- [x] Campo `emEstoque` (boolean) — sem controle de quantidade
- [x] Preço atual e preço original (para exibição de desconto)
- [x] `quantidadePacote` (ex: "Pacote com 12 unidades")

### 3.2 Carrinho de Compras
- [x] Persistência no `localStorage` (via ViewModel com Zustand implícito)
- [x] Adicionar / remover / atualizar quantidade
- [x] Cálculo de subtotal, frete estimado e total
- [x] Frete grátis acima de R$ 89,00
- [x] Layout mobile com botão de fechar/voltar
- [x] Contagem de itens no header

### 3.3 Checkout (3 etapas)
- [x] **Etapa 1 — Dados:** nome, CPF, e-mail, telefone; seleção ou cadastro de endereço
- [x] **Etapa 2 — Entrega:** ENTREGA (com endereço) ou RETIRADA na loja
- [x] **Etapa 3 — Pagamento:** PIX (QR Code + copia-e-cola) ou Cartão via MercadoPago Brick
- [x] Resumo do pedido em grid com alinhamento tabular
- [x] Polling de confirmação de pagamento a cada 5s

### 3.4 Área do Cliente
- [x] Cadastro (nome, CPF, WhatsApp, PIN)
- [x] Login (CPF + PIN)
- [x] Edição de perfil e troca de PIN
- [x] CRUD de endereços com seleção de endereço principal
- [x] Listagem de pedidos com status visual
- [x] Detalhe do pedido com timeline de status

### 3.5 Painel Administrativo
- [x] Login com JWT
- [x] CRUD de produtos (com upload de imagens para Vercel Blob)
- [x] CRUD de categorias (com ícone emoji e ordenação)
- [x] CRUD de seções da home (manual ou automática por categoria/tag)
- [x] Ordenação de seções por drag/drop ou botões
- [x] Listagem de pedidos com filtros de status e data (hoje/ontem/7 dias/todos)
- [x] Detalhe de pedido com atualização de status
- [x] Notificação em tempo real de novos pedidos (polling a cada 10s)
- [x] Listagem e edição de clientes
- [x] Toggle de estoque por produto

### 3.6 Home Page
- [x] Seções dinâmicas configuráveis pelo admin (banner, ofertas, categorias em destaque)
- [x] Modo seleção AUTOMÁTICO (por categoria ou tag) ou MANUAL (produtos específicos)
- [x] N máximo de itens por seção configurável

### 3.7 Impressão de Comprovante (ESC/POS)
- [x] Geração de receipt ESC/POS via API `/api/print`
- [x] Itens com nome, quantidade (quando > 1) e subtotal
- [x] Totais: subtotal, frete, total
- [x] Dados do cliente e endereço de entrega

### 3.8 Webhook MercadoPago
- [x] Recebimento de eventos de pagamento
- [x] Atualização de status do pedido (PAID / FAILED)
- [x] Registro de `pagoEm` e `mpStatus`

---

## 4. Problemas Críticos Identificados

### 4.1 🔴 CRÍTICO — Rotas Admin Sem Autenticação

**Todas as 19 rotas `/api/admin/*` não validam o token JWT.**

Qualquer pessoa com acesso à URL pode:
- Listar, criar, editar e deletar produtos
- Deletar categorias e seções
- Ver dados de todos os clientes (CPF, WhatsApp)
- Alterar status de pedidos
- Fazer upload de arquivos

**Correção necessária:** Criar middleware ou helper `verificarAdminJWT(request)` e aplicar em todas as route handlers admin.

```typescript
// Exemplo de helper a implementar:
// src/lib/adminAuth.ts
export async function requireAdmin(request: NextRequest): Promise<AdminPayload> {
  const token = request.cookies.get('admin_token')?.value;
  if (!token) throw new Error('Não autorizado');
  return verificarJWT(token);
}
```

### 4.2 🟠 ALTO — Sem Controle de Estoque por Quantidade

O campo `emEstoque` é booleano. Quando um pedido é confirmado (`PAID`), nenhuma quantidade é decrementada. Não há verificação de disponibilidade no checkout.

**Impacto:** Um produto marcado como disponível pode ser vendido múltiplas vezes além da quantidade real em estoque.

**Correção necessária:**
- Adicionar campo `estoqueQuantidade: Int` no model `Produto`
- Decrementar em `OrderItem.quantidade` quando pagamento for confirmado no webhook
- Validar disponibilidade antes de confirmar o pedido em `/api/checkout/iniciar`

### 4.3 🟠 ALTO — Sem Notificações de Pedido

O campo `whatsapp` é coletado no cadastro mas nunca utilizado. Não há envio de e-mail, SMS ou WhatsApp em nenhum evento do fluxo.

**Eventos sem notificação:**
- Pedido criado (cliente + admin)
- Pagamento aprovado (cliente)
- Status atualizado pelo admin (cliente)
- Cancelamento (cliente)

### 4.4 🟡 MÉDIO — Integração de Frete Incompleta

A rota `/api/frete/calcular` existe, mas não há integração com transportadora (ex: Melhor Envio, Correios). O frete é calculado de forma fixa/estimada no frontend. O admin não tem como configurar faixas de frete por CEP ou peso.

---

## 5. Débito Técnico

### 5.1 Código Morto

| Item | Localização | Impacto |
|---|---|---|
| Pacote `@google/genai` | `package.json` | Instalado, nunca importado — 500KB+ na build |
| Hook `useViaCep.ts` | `src/hooks/` | Nunca usado em nenhum componente |
| `ProdutoAPI.buscarProdutos()` | `src/services/api/produto.api.ts` | Método definido, nunca chamado |

### 5.2 Duplicação de Código

| Padrão | Ocorre em |
|---|---|
| `formatarCPF` / `formatarTelefone` | `src/utils/formatadores.ts` + inline em componentes admin |
| Conversão `Decimal → number` | Todos os route handlers que retornam produto/pedido |
| Validação de campos de endereço | `StepDados.tsx` + `cliente/enderecos/page.tsx` |

### 5.3 Performance — N+1 em Seções da Home

`/api/home/secoes` retorna seções com produtos. Se há 6 seções com `maxItens = 8`, são até 48 queries de produto individuais. Deve usar `include` com paginação no Prisma.

### 5.4 Busca Sem Funcionalidade

O campo de busca no header (`<input placeholder="Buscar...">`) não tem `onSubmit`, `onChange` nem `onKeyDown` conectado a nenhuma lógica. Clientes não conseguem buscar produtos pelo header.

---

## 6. Roadmap de Funcionalidades

### Fase 1 — Segurança e Estabilidade (Prioridade Máxima)

| # | Feature | Descrição |
|---|---|---|
| 1.1 | Auth nas rotas admin | Adicionar `requireAdmin()` em todos os 19 endpoints `/api/admin/*` |
| 1.2 | Controle de estoque | Campo `estoqueQuantidade`, decremento no webhook, validação no checkout |
| 1.3 | Rate limiting | Limitar tentativas de login (admin e cliente) para prevenir força bruta no PIN |
| 1.4 | Busca funcional | Conectar input de busca do header a `/api/produtos?q=` |

### Fase 2 — Comunicação com Cliente

| # | Feature | Descrição |
|---|---|---|
| 2.1 | WhatsApp via Evolution API | Notificação ao criar pedido e ao atualizar status |
| 2.2 | E-mail transacional | Confirmação de pedido e recibo de pagamento (Resend ou SendGrid) |
| 2.3 | Push notification web | Service Worker para notificar novos pedidos ao admin offline |

### Fase 3 — Experiência de Compra

| # | Feature | Descrição |
|---|---|---|
| 3.1 | Sistema de cupons | Código de desconto fixo ou percentual, validade, uso máximo |
| 3.2 | Lista de favoritos | Cliente salva produtos para compra futura |
| 3.3 | Avaliações de produto | Campo `avaliacao`/`numAvaliacoes` existe no schema — implementar UI |
| 3.4 | Frete real | Integração com Melhor Envio ou tabela de frete por CEP/peso |
| 3.5 | Recompra rápida | Botão "Comprar novamente" na tela de pedidos anteriores |

### Fase 4 — Operação e Analytics

| # | Feature | Descrição |
|---|---|---|
| 4.1 | Dashboard de métricas | Total de pedidos, receita, ticket médio, produtos mais vendidos |
| 4.2 | Relatório de vendas CSV | Exportação de pedidos por período |
| 4.3 | Gestão de promoções | Admin configura desconto por produto ou categoria com data de expiração |
| 4.4 | Configuração de frete pelo admin | UI para definir faixas de frete por CEP, peso e valor mínimo |

---

## 7. Modelo de Dados — Estado Atual e Lacunas

### 7.1 Entidades Existentes

```
Admin → 1 admin por sistema (sem multi-admin/permissões)
Categoria → Produto (1:N)
Produto → Tag (N:N via ProdutoTag)
Produto → Secao (N:N via SecaoItem)
Cliente → Endereco (1:N)
Cliente → Order (1:N, opcional — pedido pode ser feito sem conta)
Order → OrderItem (1:N, cascade delete)
OrderItem → Produto (N:1, snapshot de nome/imagem para histórico)
```

### 7.2 Campos Existentes Sem UI

| Campo | Model | Status |
|---|---|---|
| `avaliacao`, `numAvaliacoes` | Produto | Sem coleta de avaliações |
| `whatsapp` | Cliente | Coletado, nunca usado |
| `complemento`, `referencia` | Endereco | Campo existe, raramente preenchido |
| `mpStatus` | Order | Salvo do webhook, não exibido no admin |

### 7.3 Campos Faltantes (Propostos)

| Campo | Model | Justificativa |
|---|---|---|
| `estoqueQuantidade: Int` | Produto | Controle real de estoque |
| `cupomCodigo: String?` | Order | Rastrear uso de cupons |
| `descontoAplicado: Decimal?` | Order | Valor descontado por cupom |
| `notificacaoEnviada: Boolean` | Order | Evitar reenvio duplicado |
| `motivoCancelamento: String?` | Order | Histórico de cancelamentos |

---

## 8. Fluxos Críticos

### 8.1 Fluxo de Checkout

```
Cliente → /carrinho
  └→ [logado?] Sim → /checkout
  └→ [logado?] Não → /cliente/login?redirect=/checkout → /checkout
      ↓
  StepDados (endereço)
      ↓
  StepMetodo (entrega / retirada)
      ↓
  StepPagamento
    ├→ PIX: POST /api/checkout/iniciar → cria Order + mp payment → exibe QR
    │     └→ polling GET /api/checkout/status/[id] a cada 5s
    └→ Cartão: CartPayment Brick → aprovação inline
         └→ webhook POST /api/webhooks/mercadopago → atualiza Order.status
```

### 8.2 Fluxo de Status do Pedido

```
PENDING_PAYMENT → PAID (via webhook MercadoPago)
               → FAILED (via webhook)
               → CANCELLED (manual pelo admin)
PAID → PROCESSING → (statusCliente gerenciado pelo admin)
```

**statusCliente (exibido ao cliente):**
```
PEDIDO_REALIZADO → PAGAMENTO_PROCESSANDO → APROVADO → EM_SEPARACAO → LIBERADO → CANCELADO
```

### 8.3 Fluxo de Notificação em Tempo Real (Admin)

```
Novo pedido criado
  └→ GET /api/admin/pedidos/ping (a cada 10s pelo painel)
       └→ retorna { ultimoId, total }
            └→ [ultimoId diferente?] → exibe banner verde → click atualiza lista
```

---

## 9. Convenções e Padrões do Projeto

### 9.1 Autenticação
- Admin: cookie `admin_token` (JWT, 8h)
- Cliente: cookie `cliente_token` (JWT, 30d)
- PIN do cliente: 4 dígitos, bcrypt hash no banco

### 9.2 Datas e Fuso Horário
- Banco: UTC (Prisma padrão)
- Frontend: exibição em pt-BR
- Filtros por data no admin: BRT (UTC-3, Fortaleza/CE sem horário de verão)

### 9.3 Valores Monetários
- Banco: `Decimal(10,2)` — nunca `Float` para evitar arredondamento
- Conversão para frontend: `Number(decimal)` explicitamente nas route handlers
- Formatação: `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`

### 9.4 Estrutura de Arquivos

```
src/
├── app/
│   ├── (public)/        # Layout com Header + Footer
│   │   ├── carrinho/
│   │   ├── checkout/
│   │   ├── produto/[id]/
│   │   └── produtos/
│   ├── admin/(protected)/ # Layout com AdminTopBar
│   ├── api/             # Route handlers
│   └── cliente/         # Área logada do cliente
├── components/          # Componentes compartilhados
├── lib/                 # prisma.ts, auth helpers
├── models/              # TypeScript types/interfaces
├── services/api/        # Clientes HTTP externos
├── utils/               # formatadores, helpers
└── viewmodels/          # React hooks MVVM
```

---

## 10. Métricas de Sucesso

| Métrica | Meta | Como medir |
|---|---|---|
| Taxa de conclusão do checkout | > 60% | Pedidos pagos / checkouts iniciados |
| Tempo médio de aprovação PIX | < 2min | `pagoEm - criadoEm` |
| Pedidos por dia | crescimento MoM | Dashboard admin |
| Erros de pagamento | < 5% | `Order.status = FAILED` / total |
| Tempo de resposta API | < 500ms p95 | Vercel Analytics |

---

## 11. Restrições e Decisões de Design

1. **Sem multitenancy:** sistema dedicado para uma única loja — sem isolamento por tenant
2. **Carrinho no localStorage:** pedido não requer conta; carrinho persiste offline
3. **Sem WebSockets:** Vercel serverless tem timeout de 60s — polling é mais confiável para notificações do admin
4. **Sem sistema de filas:** eventos de pagamento são processados sincronamente no webhook — adicionar retry/idempotência é recomendado
5. **Foto única obrigatória:** campo `imagem` (string) é principal; `imagens` (array) para galeria é opcional
6. **Retirada na loja:** endereço não é necessário no modo RETIRADA — validação condicional no checkout

---

*Documento gerado a partir de análise do codebase em Maio/2026. Deve ser atualizado a cada sprint.*
