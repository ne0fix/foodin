/**
 * Serviço de notificações WhatsApp via Evolution API.
 *
 * Variáveis de ambiente necessárias:
 *   EVOLUTION_API_URL      — ex: https://api.seudominio.com
 *   EVOLUTION_API_KEY      — chave de autenticação
 *   EVOLUTION_API_INSTANCE — nome da instância (ex: "ekomart")
 *   ADMIN_WHATSAPP         — número do admin, ex: "5585991135449"
 */

interface OrderBasic {
  id: string;
  compradorNome: string;
  compradorTelefone?: string | null;
  total: number;
  statusCliente?: string | null;
  entregaTipo?: string | null;
}

const EVOLUTION_URL      = process.env.EVOLUTION_API_URL?.replace(/\/$/, '');
const EVOLUTION_KEY      = process.env.EVOLUTION_API_KEY;
const EVOLUTION_INSTANCE = process.env.EVOLUTION_API_INSTANCE;
const ADMIN_WA           = process.env.ADMIN_WHATSAPP;

function isConfigurado(): boolean {
  return !!(EVOLUTION_URL && EVOLUTION_KEY && EVOLUTION_INSTANCE);
}

function formatarMoeda(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

async function enviar(numero: string, mensagem: string): Promise<void> {
  if (!isConfigurado()) return;

  const url = `${EVOLUTION_URL}/message/sendText/${EVOLUTION_INSTANCE}`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: EVOLUTION_KEY!,
      },
      body: JSON.stringify({
        number: numero,
        text: mensagem,
      }),
    });
    if (!res.ok) {
      console.warn('[notificacoes] Falha ao enviar WhatsApp:', res.status, await res.text());
    }
  } catch (err) {
    console.warn('[notificacoes] Erro ao enviar WhatsApp:', err);
  }
}

export async function notificarNovoPedido(order: OrderBasic): Promise<void> {
  // Notifica o admin sobre novo pedido
  if (ADMIN_WA) {
    const msg =
      `🛒 *Novo Pedido!*\n\n` +
      `👤 Cliente: ${order.compradorNome}\n` +
      `💰 Total: ${formatarMoeda(order.total)}\n` +
      `🚚 Entrega: ${order.entregaTipo === 'RETIRADA' ? 'Retirada na loja' : 'Entrega'}\n` +
      `🔑 Pedido: #${order.id.slice(-6).toUpperCase()}\n\n` +
      `Acesse o painel para confirmar.`;
    await enviar(ADMIN_WA, msg);
  }

  // Notifica o cliente que o pedido foi recebido
  if (order.compradorTelefone) {
    const msg =
      `Olá, *${order.compradorNome.split(' ')[0]}*! 👋\n\n` +
      `✅ Seu pedido *#${order.id.slice(-6).toUpperCase()}* foi recebido com sucesso!\n` +
      `💰 Total: ${formatarMoeda(order.total)}\n\n` +
      `Aguarde a confirmação do pagamento. Obrigado por comprar no *Super G&N*! 🛒`;
    await enviar(order.compradorTelefone, msg);
  }
}

export async function notificarPagamentoAprovado(order: OrderBasic): Promise<void> {
  if (!order.compradorTelefone) return;

  const msg =
    `🎉 *Pagamento Confirmado!*\n\n` +
    `Olá, *${order.compradorNome.split(' ')[0]}*!\n` +
    `Seu pagamento do pedido *#${order.id.slice(-6).toUpperCase()}* foi aprovado.\n` +
    `Estamos separando seus produtos. Em breve você receberá uma atualização! 📦`;
  await enviar(order.compradorTelefone, msg);
}

export async function notificarStatusAtualizado(
  order: OrderBasic,
  novoStatus: string,
): Promise<void> {
  if (!order.compradorTelefone) return;

  const mensagens: Record<string, string> = {
    APROVADO:              '✅ Seu pedido foi *aprovado* e está sendo processado!',
    EM_SEPARACAO:          '📦 Seus produtos estão sendo *separados*!',
    LIBERADO:              '🚚 Seu pedido foi *liberado para entrega/retirada*! Em breve chegará até você.',
    CANCELADO:             '❌ Seu pedido foi *cancelado*. Entre em contato se precisar de ajuda.',
    PAGAMENTO_PROCESSANDO: '⏳ Seu pagamento está sendo *processado*. Aguarde.',
  };

  const detalhe = mensagens[novoStatus];
  if (!detalhe) return;

  const msg =
    `Olá, *${order.compradorNome.split(' ')[0]}*! 👋\n\n` +
    `Atualização do pedido *#${order.id.slice(-6).toUpperCase()}*:\n\n` +
    detalhe;
  await enviar(order.compradorTelefone, msg);
}
