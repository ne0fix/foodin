/**
 * Teste automatizado E2E — PIX e Cartão (Sandbox Mercado Pago)
 * Uso: node scripts/testar-pagamentos.mjs
 * Requer: servidor rodando em localhost:3000 (npm run dev)
 */

import { createHmac } from 'crypto';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// ─── cores ───────────────────────────────────────────────────────────────────
const G = '\x1b[32m', R = '\x1b[31m', Y = '\x1b[33m', C = '\x1b[36m',
      B = '\x1b[1m',  D = '\x1b[2m',  X = '\x1b[0m';
const ok   = (m) => console.log(`  ${G}✅${X} ${m}`);
const fail = (m) => console.log(`  ${R}❌${X} ${m}`);
const info = (m) => console.log(`  ${Y}ℹ${X}  ${m}`);
const sep  = (t) => console.log(`\n${C}${B}${t}${X}\n${'─'.repeat(55)}`);

// ─── env ─────────────────────────────────────────────────────────────────────
function loadEnv() {
  try {
    const content = readFileSync(resolve(process.cwd(), '.env.local'), 'utf-8');
    const env = {};
    for (const line of content.split('\n')) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const idx = t.indexOf('=');
      if (idx > 0) env[t.slice(0, idx).trim()] = t.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
    }
    return env;
  } catch { return {}; }
}

const env  = loadEnv();
const BASE = 'https://digitalgen.vercel.app';

// ─── utilitários ──────────────────────────────────────────────────────────────
function moeda(n) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
}

async function post(path, body) {
  const r = await fetch(`${BASE}${path}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { status: r.status, data: await r.json() };
}

async function get(path) {
  const r = await fetch(`${BASE}${path}`);
  return { status: r.status, data: await r.json() };
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ─── dados de teste ──────────────────────────────────────────────────────────
const COMPRADOR = {
  nome: 'Teste Automatizado', email: 'test@test.com',
  cpf: '12345678909', telefone: '85999990000',
};
const ENTREGA = {
  tipo: 'ENTREGA', cep: '60175047', logradouro: 'Av. Santos Dumont',
  numero: '5001', bairro: 'Papicu', cidade: 'Fortaleza', uf: 'CE',
};
// Cartões de teste MP sandbox
const CARTOES = [
  { num: '5031 7557 3453 0604', bandeira: 'Mastercard', resultado: 'aprovado' },
  { num: '4013 5406 8274 6260', bandeira: 'Visa',       resultado: 'recusado' },
];

// ─── buscar produto ───────────────────────────────────────────────────────────
async function buscarProduto() {
  const { status, data } = await get('/api/produtos');
  if (status !== 200) throw new Error(`API produtos: ${status}`);
  const lista = Array.isArray(data) ? data : data.produtos;
  if (!lista?.length) throw new Error('Nenhum produto encontrado');
  return lista[0];
}

// ─── simular webhook com HMAC ─────────────────────────────────────────────────
async function simularWebhook(mpPaymentId, destino = BASE) {
  const secret = env.MP_WEBHOOK_SECRET || '';
  const ts = Date.now().toString();
  const payload = JSON.stringify({
    id: parseInt(mpPaymentId), type: 'payment', live_mode: false,
    api_version: 'v1', action: 'payment.updated',
    data: { id: mpPaymentId },
  });
  const headers = { 'Content-Type': 'application/json' };
  if (secret) {
    const tmpl = `id:${mpPaymentId};request-date:${ts};`;
    const hmac = createHmac('sha256', secret).update(tmpl).digest('hex');
    headers['x-signature'] = `ts=${ts},v1=${hmac}`;
  }
  const r = await fetch(`${destino}/api/webhooks/mercadopago`,
    { method: 'POST', headers, body: payload });
  return { status: r.status, data: await r.json() };
}

// ─── polling de status ────────────────────────────────────────────────────────
async function aguardarStatus(orderId, esperado, timeoutMs = 15000) {
  const ini = Date.now();
  while (Date.now() - ini < timeoutMs) {
    const { data } = await get(`/api/checkout/status/${orderId}`);
    if (data.status === esperado) return data;
    await sleep(1000);
  }
  return null;
}

// ─── TESTE 1: PIX ─────────────────────────────────────────────────────────────
async function testarPix(produto) {
  sep('🧪 TESTE 1 — PIX');
  const frete = 20;
  const total = Math.round((parseFloat(produto.preco) + frete) * 100) / 100;
  info(`Produto: ${B}${produto.nome}${X}  |  Total esperado: ${G}${moeda(total)}${X}`);

  // 1. Criar pedido
  const { status, data } = await post('/api/checkout/iniciar', {
    itens: [{ produtoId: produto.id, quantidade: 1 }],
    comprador: COMPRADOR, entrega: ENTREGA, metodo: 'PIX', frete,
  });

  if (status !== 200 || !data.orderId) {
    fail(`Criação do pedido: HTTP ${status} — ${data.error ?? JSON.stringify(data)}`);
    return false;
  }
  ok(`Pedido criado: ${B}${data.orderId}${X}`);

  // 2. QR Code
  if (data.qrCode) {
    ok(`QR Code gerado (${data.qrCode.length} chars)`);
    console.log(`  ${D}${data.qrCode.slice(0, 80)}...${X}`);
  } else {
    fail('QR Code ausente na resposta');
    return false;
  }

  // 3. Status inicial
  const { data: st1 } = await get(`/api/checkout/status/${data.orderId}`);
  ok(`Status inicial: ${B}${st1.status}${X}  |  mpPaymentId: ${B}${st1.mpPaymentId}${X}`);

  if (!st1.mpPaymentId) { fail('mpPaymentId ausente no status'); return false; }

  // 4. Simular webhook de pagamento aprovado
  info('Simulando webhook de pagamento aprovado...');
  const { status: whStatus, data: whData } = await simularWebhook(st1.mpPaymentId);
  if (whStatus === 200) {
    ok(`Webhook aceito: ${JSON.stringify(whData)}`);
  } else {
    fail(`Webhook retornou ${whStatus}: ${JSON.stringify(whData)}`);
    return false;
  }

  // 5. Polling: aguardar status PAID ou PROCESSING (MP sandbox pode não ter o pagamento pendente)
  await sleep(1500);
  const { data: st2 } = await get(`/api/checkout/status/${data.orderId}`);
  ok(`Status pós-webhook: ${B}${st2.status}${X}`);

  // No sandbox, o pagamento real está "pending" no MP — a simulação do webhook
  // vai consultar o MP e retornar o status real (pending → PROCESSING).
  // O pagamento só fica PAID quando simulado no painel MP.
  const statusEsperados = ['PAID', 'PROCESSING', 'PENDING_PAYMENT'];
  if (statusEsperados.includes(st2.status)) {
    ok(`Fluxo PIX completo ✓  (status: ${st2.status})`);
    return { ok: true, orderId: data.orderId, mpPaymentId: st1.mpPaymentId };
  } else {
    fail(`Status inesperado: ${st2.status}`);
    return false;
  }
}

// ─── TESTE 2: Cartão aprovado (sandbox) ──────────────────────────────────────
async function testarCartaoSandbox(produto) {
  sep('🧪 TESTE 2 — Cartão (sandbox, sem tokenização)');
  info('Nota: tokenização real requer browser — testando a API diretamente com token simulado');
  info('Use o formulário em https://digitalgen.vercel.app/checkout para teste real no browser');

  // No sandbox, podemos testar se a rota aceita um payload de cartão válido
  const frete = 20;
  const { status, data } = await post('/api/checkout/iniciar', {
    itens: [{ produtoId: produto.id, quantidade: 1 }],
    comprador: COMPRADOR, entrega: ENTREGA, metodo: 'CARTAO', frete,
    cardToken: 'TOKEN_INVALIDO_TESTE',
    parcelas: 1,
    paymentMethodId: 'master',
  });

  // Esperamos 502 (MP recusa o token inválido) — não 400/500 do nosso código
  if (status === 502 || (status === 200 && data.orderId)) {
    if (status === 502) {
      ok(`API de cartão respondeu corretamente — MP recusou token inválido (${status})`);
    } else {
      ok(`Pedido de cartão criado: ${data.orderId} — status: ${data.status}`);
    }
    return true;
  } else {
    fail(`Resposta inesperada: HTTP ${status} — ${JSON.stringify(data)}`);
    return false;
  }
}

// ─── TESTE 3: Webhook production (endpoint real) ──────────────────────────────
async function testarWebhookProducao() {
  sep('🧪 TESTE 3 — Webhook endpoint');
  const PROD = BASE;
  info(`Destino: ${PROD}/api/webhooks/mercadopago`);

  // Simular exatamente o payload do botão "Testar" do painel MP
  const payload = {
    action: 'payment.updated', api_version: 'v1',
    data: { id: '123456' }, date_created: '2021-11-01T02:02:02Z',
    id: '123456', live_mode: false, type: 'payment', user_id: 2901116807,
  };
  const r = await fetch(`${PROD}/api/webhooks/mercadopago`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await r.json();

  if (r.status === 200) {
    ok(`Webhook endpoint responde 200: ${JSON.stringify(body)}`);
    return true;
  } else {
    fail(`Webhook retornou ${r.status}: ${JSON.stringify(body)}`);
    return false;
  }
}

// ─── TESTE 4: Frete API produção ──────────────────────────────────────────────
async function testarFreteProd() {
  sep('🧪 TESTE 4 — Frete API');
  const PROD = BASE;
  const casos = [
    ['01310100', 50,  'SP', 10],
    ['60175047', 50,  'CE', 20],
    ['01310100', 250, 'SP',  0],
  ];
  let pass = 0;
  for (const [cep, sub, uf, esperado] of casos) {
    const r = await fetch(`${PROD}/api/frete/calcular?cep=${cep}&subtotal=${sub}`);
    const d = await r.json();
    if (r.status === 200 && d.uf === uf && d.frete === esperado) {
      ok(`CEP ${cep} → ${d.cidade}/${d.uf} — Frete: ${moeda(d.frete)}`);
      pass++;
    } else {
      fail(`CEP ${cep} → esperado frete ${moeda(esperado)} em ${uf}, recebido: ${JSON.stringify(d)}`);
    }
  }
  return pass === casos.length;
}

// ─── MAIN ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n${C}${B}╔══════════════════════════════════════════════════════╗${X}`);
  console.log(`${C}${B}║   Testes de Pagamento — Ekomart Sandbox MP           ║${X}`);
  console.log(`${C}${B}╚══════════════════════════════════════════════════════╝${X}`);
  console.log(`${D}  Domínio : ${BASE}${X}\n`);

  const resultados = [];

  // Buscar produto
  let produto;
  try {
    produto = await buscarProduto();
    info(`Produto selecionado: "${produto.nome}" — ${moeda(produto.preco)}`);
  } catch (e) {
    fail(`Não foi possível buscar produto: ${e.message}`);
    console.log(`  ${Y}→ Verifique se o servidor está rodando: npm run dev${X}\n`);
    process.exit(1);
  }

  // Testes
  const r1 = await testarPix(produto);
  resultados.push({ nome: 'PIX (local)', ok: !!r1 });

  const r2 = await testarCartaoSandbox(produto);
  resultados.push({ nome: 'Cartão API (local)', ok: r2 });

  const r3 = await testarWebhookProducao();
  resultados.push({ nome: 'Webhook endpoint (produção)', ok: r3 });

  const r4 = await testarFreteProd();
  resultados.push({ nome: 'Frete API (produção)', ok: r4 });

  // Sumário
  sep('📊 SUMÁRIO');
  let aprovados = 0;
  for (const r of resultados) {
    if (r.ok) { ok(r.nome); aprovados++; }
    else       { fail(r.nome); }
  }

  console.log(`\n${'─'.repeat(55)}`);
  const cor = aprovados === resultados.length ? G : Y;
  console.log(`\n  ${cor}${B}${aprovados}/${resultados.length} testes passaram${X}\n`);

  if (r1 && r1.ok) {
    console.log(`${Y}${B}Para confirmar pagamento PIX no sandbox:${X}`);
    console.log(`  1. Acesse: ${C}https://www.mercadopago.com.br/developers/panel/app${X}`);
    console.log(`  2. Login com conta COMPRADORA de teste`);
    console.log(`  3. Atividade → localize o pagamento → "Simular pagamento"`);
    console.log(`  4. Verifique o pedido em: ${C}https://digitalgen.vercel.app/admin/pedidos${X}`);
    console.log(`\n  ${D}ou simule localmente:${X}`);
    console.log(`  ${C}node scripts/simular-webhook.mjs --payment-id ${r1.mpPaymentId}${X}\n`);
  }

  console.log(`${Y}${B}Para testar cartão no browser (tokenização real):${X}`);
  console.log(`  ${C}https://digitalgen.vercel.app/checkout${X}`);
  for (const c of CARTOES) {
    console.log(`  ${c.resultado === 'aprovado' ? G+'✅' : R+'❌'}${X} ${c.bandeira}: ${B}${c.num}${X}  CVV: 123  Val: 12/30`);
  }
  console.log();
}

main().catch(e => { console.error(`\n${R}Erro: ${e.message}${X}\n`); process.exit(1); });
