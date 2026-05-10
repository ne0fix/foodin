# Prompt para Gemini Pro — Implementação do USER.PRD
## Sistema de Autenticação de Clientes — Ekomart

Cole este prompt integralmente no Gemini Pro. Ele é autossuficiente.

---

## PROMPT

Você é um engenheiro de software sênior especializado em Next.js 16 App Router, Prisma 5, autenticação JWT e e-commerce brasileiro.

Sua missão é implementar **gradativamente** o sistema de autenticação de clientes do Ekomart, seguindo um PRD detalhado já existente no repositório.

---

### 1. LEITURA OBRIGATÓRIA ANTES DE QUALQUER CÓDIGO

Leia os seguintes arquivos **nesta ordem exata** e confirme o conteúdo de cada um antes de prosseguir:

```
1.  /home/projetasaude/Vídeos/ekomart/USER.PRD                         ← PRD completo (leia integralmente)
2.  /home/projetasaude/Vídeos/ekomart/prisma/schema.prisma              ← schema atual do banco
3.  /home/projetasaude/Vídeos/ekomart/src/proxy.ts                      ← middleware de auth (CRÍTICO)
4.  /home/projetasaude/Vídeos/ekomart/src/lib/auth.ts                   ← JWT do admin (referência)
5.  /home/projetasaude/Vídeos/ekomart/src/lib/password.ts               ← hashPassword/comparePassword
6.  /home/projetasaude/Vídeos/ekomart/src/lib/prisma.ts                 ← singleton do Prisma
7.  /home/projetasaude/Vídeos/ekomart/src/lib/rateLimit.ts              ← rate limiter existente
8.  /home/projetasaude/Vídeos/ekomart/src/utils/validators.ts           ← validarCPF, formatarCPF (já existem!)
9.  /home/projetasaude/Vídeos/ekomart/src/app/api/auth/login/route.ts   ← padrão de auth do admin
10. /home/projetasaude/Vídeos/ekomart/src/models/checkout.model.ts      ← tipos do checkout
11. /home/projetasaude/Vídeos/ekomart/src/app/(public)/checkout/page.tsx ← checkout atual
12. /home/projetasaude/Vídeos/ekomart/src/app/api/checkout/iniciar/route.ts ← API de checkout
13. /home/projetasaude/Vídeos/ekomart/src/components/Header.tsx         ← header atual
14. /home/projetasaude/Vídeos/ekomart/package.json                      ← dependências instaladas
15. /home/projetasaude/Vídeos/ekomart/tsconfig.json                     ← path aliases
```

**Só avance para implementação após confirmar todos os arquivos lidos.**

---

### 2. CRIAR O ARQUIVO DE PROGRESSO IMEDIATAMENTE

**Crie o arquivo `/home/projetasaude/Vídeos/ekomart/userprograssoemini.prd`** com o conteúdo abaixo assim que iniciar:

```markdown
# userprograssoemini.prd — Progresso de Implementação do Sistema de Clientes
## Ekomart — Autenticação de Clientes com CPF + PIN

Atualizado após cada passo concluído.

## Status Geral
- Início: [preencher com data/hora atual]
- Conclusão: pendente
- Passos concluídos: 0 / 33
- Build: pendente

## Progresso por Passo

| # | Arquivo / Ação | Status | Observações |
|---|----------------|--------|-------------|
| 1  | prisma/schema.prisma — adicionar Cliente, Endereco, StatusPedidoCliente, clienteId em Order | ⏳ | |
| 2  | npx prisma migrate dev --name add_cliente_endereco | ⏳ | |
| 3  | npx prisma generate | ⏳ | |
| 4  | src/lib/clienteAuth.ts — criar | ⏳ | |
| 5  | src/proxy.ts — expandir matcher e lógica de cliente | ⏳ | |
| 6  | src/hooks/useViaCep.ts — criar | ⏳ | |
| 7  | src/components/ui/PinInput.tsx — criar | ⏳ | |
| 8  | src/components/ui/StatusBadge.tsx — criar | ⏳ | |
| 9  | src/components/ui/OrderTimeline.tsx — criar | ⏳ | |
| 10 | src/app/api/cliente/cadastrar/route.ts — POST | ⏳ | |
| 11 | src/app/api/cliente/login/route.ts — POST | ⏳ | |
| 12 | src/app/api/cliente/logout/route.ts — POST | ⏳ | |
| 13 | src/app/api/cliente/me/route.ts — GET | ⏳ | |
| 14 | src/app/api/cliente/perfil/route.ts — PUT | ⏳ | |
| 15 | src/app/api/cliente/pin/route.ts — PUT | ⏳ | |
| 16 | src/app/api/cliente/enderecos/route.ts — GET + POST | ⏳ | |
| 17 | src/app/api/cliente/enderecos/[id]/route.ts — PUT + DELETE | ⏳ | |
| 18 | src/app/api/cliente/enderecos/[id]/principal/route.ts — PUT | ⏳ | |
| 19 | src/app/api/cliente/pedidos/route.ts — GET | ⏳ | |
| 20 | src/app/api/cliente/pedidos/[id]/route.ts — GET | ⏳ | |
| 21 | src/app/cadastro/page.tsx — formulário completo | ⏳ | |
| 22 | src/app/cliente/login/page.tsx — CPF + PIN | ⏳ | |
| 23 | src/app/cliente/layout.tsx — layout protegido + header | ⏳ | |
| 24 | src/app/cliente/page.tsx — dashboard | ⏳ | |
| 25 | src/app/cliente/pedidos/page.tsx — lista de pedidos | ⏳ | |
| 26 | src/app/cliente/pedidos/[id]/page.tsx — detalhe + timeline | ⏳ | |
| 27 | src/app/cliente/perfil/page.tsx — editar dados + endereços | ⏳ | |
| 28 | src/app/cliente/seguranca/page.tsx — trocar PIN | ⏳ | |
| 29 | src/app/(public)/checkout/page.tsx — integrar cliente logado | ⏳ | |
| 30 | src/app/api/checkout/iniciar/route.ts — vincular clienteId | ⏳ | |
| 31 | src/components/Header.tsx — estado de login no ícone conta | ⏳ | |
| 32 | npx tsc --noEmit — verificar TypeScript | ⏳ | |
| 33 | npm run build — build final | ⏳ | |

## Erros Encontrados
_Nenhum até o momento._

## Decisões Tomadas
_Registrar aqui desvios do PRD com justificativa._

## Resumo Final
- Arquivos criados: —
- Arquivos modificados: —
- Erros encontrados e resolvidos: —
```

**Regra:** Após concluir cada passo, atualize imediatamente a linha correspondente:
- `✅` — concluído sem problemas
- `❌` — falhou (registre em "Erros Encontrados")
- `⚠️` — concluído com adaptação (registre em "Decisões Tomadas")

---

### 3. REGRAS INEGOCIÁVEIS DO PROJETO

Estas regras têm prioridade sobre qualquer padrão genérico de Next.js:

**R1 — `proxy.ts` nunca vira `middleware.ts`**
O projeto exporta `proxy` de `src/proxy.ts`. Nunca criar `middleware.ts`. Ao expandir o proxy, manter o export `proxy` e a função com esse nome.

**R2 — `params` em Route Handlers é Promise no Next.js 16**
```typescript
// CORRETO
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
}
// ERRADO — causa erro em produção
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params; // ← nunca fazer isso
}
```

**R3 — Valores Decimal do Prisma sempre convertidos**
```typescript
parseFloat(valor.toString()) // ← obrigatório para campos @db.Decimal
```

**R4 — Usar funções existentes — nunca duplicar**
- `hashPassword()` e `comparePassword()` → `@/src/lib/password.ts`
- `validarCPF()`, `formatarCPF()`, `formatarTelefone()` → `@/src/utils/validators.ts`
- Cliente Prisma singleton → `@/src/lib/prisma.ts` (default export `prisma`)
- Rate limit → `@/src/lib/rateLimit.ts`

**R5 — JWT usa `jose` (Edge Runtime)**
O middleware roda no Edge Runtime. Usar apenas `jose` para JWT — nunca `jsonwebtoken` no middleware ou em `clienteAuth.ts`.

**R6 — Erro genérico no login**
```typescript
// SEMPRE retornar a mesma mensagem — nunca revelar qual campo está errado
return NextResponse.json({ error: 'CPF ou PIN inválidos' }, { status: 401 });
```

**R7 — PIN nunca em plaintext**
O PIN sempre passa por `hashPassword()` antes de ser salvo. Nunca armazenar ou logar o PIN em nenhum formato legível.

**R8 — Sem comentários explicativos do "quê"**
Apenas comentários com o "porquê" quando não for óbvio. Nunca escrever `// Busca o cliente no banco` ou similar.

**R9 — Formulários sem react-hook-form**
O projeto usa `useState` + Zod + submit manual. Não instalar `react-hook-form`.

**R10 — Tailwind 4 sem `@apply`**
Apenas classes inline nos arquivos `.tsx`. Não criar arquivos CSS separados para componentes.

**R11 — Path alias**
Usar `@/src/...` (nunca caminhos relativos longos como `../../lib/prisma`).

---

### 4. ESTRATÉGIA DE IMPLEMENTAÇÃO GRADATIVA

Implemente **um passo por vez** na sequência definida (passos 1 a 33 do USER.PRD seção 14).

**Para cada passo:**
1. Leia o que o PRD especifica para aquele passo
2. Implemente o arquivo ou ação
3. Verifique se há erros de TypeScript no arquivo criado
4. Atualize o `userprograssoemini.prd` com o resultado
5. Só então passe para o próximo passo

**Não avance se o passo atual tiver erro.** Um erro na migration Prisma (passo 2) bloqueia todos os passos seguintes.

---

### 5. DETALHES CRÍTICOS POR GRUPO DE PASSOS

#### Passos 1–3: Schema e Migration

Adicionar ao `prisma/schema.prisma` os modelos exatos do USER.PRD seção 3. Ao modificar o model `Order`, adicionar apenas os campos novos — não reescrever o model inteiro.

Campos a adicionar em `Order`:
```prisma
clienteId     String?
cliente       Cliente? @relation("ClientePedidos", fields: [clienteId], references: [id])
statusCliente StatusPedidoCliente @default(PEDIDO_REALIZADO)
```

Após a migration, verificar que o banco foi atualizado:
```bash
npx prisma studio  # opcional — para confirmar visualmente
```

#### Passo 4: clienteAuth.ts

Criar uma versão idêntica à `src/lib/auth.ts` existente, mas:
- Payload: `{ clienteId: string; cpf: string }` (não adminId/email)
- Cookie name: `cliente-token` (não `admin-token`)
- Export `signClienteJWT`, `verifyClienteJWT`, `getClienteFromNextRequest`

#### Passo 5: Expandir proxy.ts

**CRÍTICO — não substituir o arquivo, apenas expandir.**

Adicionar lógica para rotas `/cliente/**` e `/api/cliente/**`:
- Paths públicos (não proteger): `/cliente/login`, `/cadastro`, `/api/cliente/login`, `/api/cliente/cadastrar`
- Paths protegidos: todo o resto de `/cliente/**` e `/api/cliente/**`
- Se não autenticado em UI → redirect `/cliente/login?redirect={pathname}`
- Se não autenticado em API → `401 { error: 'Não autorizado' }`
- Se autenticado → injetar header `X-Cliente-Id` para uso nos Route Handlers

Expandir o `matcher`:
```typescript
export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
    '/cliente/:path*',
    '/api/cliente/:path*',
  ],
};
```

#### Passos 10–20: Route Handlers

Cada handler protegido deve começar com:
```typescript
const clienteId = req.headers.get('X-Cliente-Id');
if (!clienteId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
```

(O middleware já garante que só chegará aqui se o token for válido, mas a verificação defensiva é boa prática.)

#### Passos 21–28: Páginas do Cliente

**Estilo visual consistente com o projeto:**
- Paleta: `green-600` como cor primária, `gray-900` para textos principais
- Inputs: `border border-gray-300 focus:border-green-500 rounded-xl px-4 py-3`
- Botões primários: `bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-xl`
- Cards: `bg-white rounded-2xl border border-gray-200 shadow-sm p-5`
- Containers: `container mx-auto px-4 max-w-3xl`

**Página de cadastro** (`/cadastro`) — campos na ordem:
1. Nome completo
2. CPF (com máscara `formatarCPF`)
3. WhatsApp (com máscara `formatarTelefone`)
4. CEP → busca ViaCEP → preenche automaticamente
5. Logradouro (readonly após preenchimento)
6. Número (obrigatório, manual)
7. Complemento (opcional)
8. Referência (opcional)
9. Bairro (readonly após preenchimento)
10. Cidade / UF (readonly após preenchimento)
11. PIN — usar `<PinInput />`
12. Confirmação de PIN — usar `<PinInput />`

**Validação client-side antes de enviar:**
- CPF: `validarCPF(cpf.replace(/\D/g,''))`
- PIN === PIN de confirmação
- PIN deve ter exatamente 4 dígitos
- CEP consultado com sucesso (endereço preenchido)

**Página de login** (`/cliente/login`) — fluxo de foco:
1. Usuário digita CPF → ao preencher 11 dígitos, mover foco automaticamente para o primeiro campo do PIN
2. Usuário preenche 4 dígitos do PIN → submeter automaticamente (ou via botão)

**Layout da área do cliente** (`/cliente/layout.tsx`):
- Verificar `cookie('cliente-token')` — se ausente, redirect para login
- Header fixo com: logo + nome do cliente + link "Minha Conta" + botão "Sair"
- Sidebar ou nav inferior mobile com: Dashboard, Pedidos, Perfil, Segurança

#### Passos 29–31: Integração no Checkout e Header

**Checkout** — o cliente logado NÃO precisa preencher o Step 2 (dados pessoais). A lógica:
```typescript
// No checkout/page.tsx — detectar login sem bloquear
useEffect(() => {
  fetch('/api/cliente/me')
    .then(r => r.ok ? r.json() : null)
    .then(data => { if (data?.id) setClienteLogado(data); })
    .catch(() => {});
}, []);
```

Se `clienteLogado !== null`:
- Pular direto do Step 1 (método) para Step 3 (entrega/pagamento)
- Pré-preencher dados do comprador com dados do cliente
- Mostrar endereço principal do cliente com opção de trocar

**Header** — o ícone de conta deve refletir o estado de login:
```typescript
// Verificar login de cliente no Header (não bloqueia o render)
fetch('/api/cliente/me')
  .then(r => r.ok ? r.json() : null)
  .then(d => d?.nome ? setClienteNome(d.nome.split(' ')[0]) : null)
  .catch(() => {});

// Se logado: href="/cliente", mostrar "Olá, {nome}" ou badge verde
// Se não logado: href="/cliente/login"
```

---

### 6. TRATAMENTO DE ERROS DURANTE A IMPLEMENTAÇÃO

Se encontrar um erro em qualquer passo:

**1. Registre imediatamente no `userprograssoemini.prd`:**
```markdown
### Erro no Passo N — [nome do arquivo]
- **Arquivo:** caminho completo
- **Erro:** mensagem exata
- **Causa:** o que originou o erro
- **Solução:** como foi resolvido
- **Status:** ✅ resolvido / ⏳ pendente
```

**2. Tente resolver antes de avançar:**
- Erro de TypeScript → corrija no mesmo arquivo antes de continuar
- Erro de migration Prisma → verifique o schema e rode novamente
- Erro de import → verifique o path alias e o arquivo de destino
- Erro de build → corrija todos os erros antes de marcar o passo 33 como concluído

**3. Se não conseguir resolver:** Marque como `❌`, documente o erro completo e continue com o próximo passo que não dependa do atual.

---

### 7. VERIFICAÇÕES POR TIPO DE ARQUIVO

#### Route Handlers (`/api/cliente/*/route.ts`)
- [ ] Importa `NextRequest`, `NextResponse` de `next/server`
- [ ] Rota protegida lê `req.headers.get('X-Cliente-Id')`
- [ ] `params` com `await params` em rotas dinâmicas `[id]`
- [ ] Valores Decimal com `parseFloat(...toString())`
- [ ] Validação de body com Zod antes de qualquer operação no banco
- [ ] Nunca retornar `pinHash` em nenhuma resposta

#### Client Components (`page.tsx` com interação)
- [ ] `'use client'` na primeira linha
- [ ] `useRouter` de `next/navigation` (não de `next/router`)
- [ ] `Link` de `next/link`
- [ ] `Image` de `next/image`
- [ ] Sem imports de Node.js (crypto, fs, etc.)

#### Server Components / Route Handlers
- [ ] Sem `'use client'`
- [ ] Pode importar `prisma` de `@/src/lib/prisma`

#### Modificação do `proxy.ts`
- [ ] Export mantido como `proxy` (não `middleware`)
- [ ] `config.matcher` expandido com rotas de cliente
- [ ] `verifyClienteJWT` importada de `@/src/lib/clienteAuth`
- [ ] Paths públicos corretamente isentos da proteção

---

### 8. CRITÉRIO DE CONCLUSÃO

A implementação só está completa quando:

- [ ] Todos os 33 passos marcados com `✅`
- [ ] `npx tsc --noEmit` sem erros
- [ ] `npm run build` completa sem erros
- [ ] Fluxo testado: `/cadastro` → `/cliente/login` → `/cliente` → `/cliente/pedidos`
- [ ] `userprograssoemini.prd` atualizado com status final

**Ao concluir**, atualize o cabeçalho do `userprograssoemini.prd`:
```markdown
## Status Geral
- Início: [hora início]
- Conclusão: [hora conclusão]
- Passos concluídos: 33 / 33
- Build: ✅ sucesso

## Resumo Final
- Arquivos criados: N
- Arquivos modificados: N
- Erros encontrados e resolvidos: N
- Desvios do PRD: N (listar se houver)
```

---

### 9. REFERÊNCIA RÁPIDA DE IMPORTS

```typescript
// Prisma client
import { prisma } from '@/src/lib/prisma';
// ou: import prisma from '@/src/lib/prisma';  ← verificar se é default ou named

// Auth de cliente (a criar)
import { signClienteJWT, verifyClienteJWT, getClienteFromNextRequest } from '@/src/lib/clienteAuth';

// Hash de senha/PIN (já existe)
import { hashPassword, comparePassword } from '@/src/lib/password';

// Rate limit (já existe)
import { checkRateLimit } from '@/src/lib/rateLimit';

// Validadores CPF (já existe — NÃO recriar)
import { validarCPF, formatarCPF, formatarTelefone } from '@/src/utils/validators';

// Formatador de moeda (já existe)
import { formatarMoeda } from '@/src/utils/formatadores';

// Next.js
import { NextRequest, NextResponse } from 'next/server';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

// Ícones (já instalado)
import { User, Lock, MapPin, Package, ChevronRight, LogOut, ... } from 'lucide-react';

// Validação
import { z } from 'zod';
```

---

### 10. AVISO FINAL

**Comece agora lendo o `USER.PRD` completo.**

Não escreva uma linha de código antes de ler todos os 14 arquivos listados na seção 1. O projeto tem convenções específicas que diferem do padrão Next.js — ignorá-las vai causar erros em produção.

Após a leitura, crie o `userprograssoemini.prd` e comece pelo passo 1 (schema Prisma).
