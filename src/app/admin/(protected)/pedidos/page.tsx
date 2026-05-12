'use client';

import { useState, useEffect, useCallback, useRef, Suspense, useTransition } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
  Loader2, Printer, ArrowRight, X, Package,
  User, CreditCard, MapPin, ChevronLeft, ChevronRight, ShoppingBag, RotateCcw,
  Mail, Phone, FileText, Truck, Store, Bell, CalendarDays,
} from 'lucide-react';
import { formatarMoeda } from '@/src/utils/formatadores';
import { OrderTimeline } from '@/src/components/ui/OrderTimeline';

// ─── Config de status ────────────────────────────────────────────────────────

const STATUS_PAG: Record<string, { label: string; bg: string; text: string; dot: string; iconBg: string }> = {
  PENDING_PAYMENT: { label: 'Aguardando',  bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-400', iconBg: 'bg-yellow-50' },
  PROCESSING:      { label: 'Processando', bg: 'bg-blue-50',   text: 'text-blue-700',   dot: 'bg-blue-400',   iconBg: 'bg-blue-50'   },
  PAID:            { label: 'Pago',        bg: 'bg-green-50',  text: 'text-green-700',  dot: 'bg-green-500',  iconBg: 'bg-green-50'  },
  FAILED:          { label: 'Falhou',      bg: 'bg-red-50',    text: 'text-red-700',    dot: 'bg-red-400',    iconBg: 'bg-red-50'    },
  CANCELLED:       { label: 'Cancelado',   bg: 'bg-gray-100',  text: 'text-gray-600',   dot: 'bg-gray-400',   iconBg: 'bg-gray-100'  },
};

const STATUS_CLI: Record<string, { label: string; bg: string; text: string }> = {
  PEDIDO_REALIZADO:      { label: 'Pedido Realizado',  bg: 'bg-gray-100',   text: 'text-gray-700'   },
  PAGAMENTO_PROCESSANDO: { label: 'Pag. Processando',  bg: 'bg-yellow-100', text: 'text-yellow-700' },
  EM_SEPARACAO:          { label: 'Em Separação',      bg: 'bg-orange-100', text: 'text-orange-700' },
  LIBERADO:              { label: 'Liberado',          bg: 'bg-green-100',  text: 'text-green-700'  },
  CANCELADO:             { label: 'Cancelado',         bg: 'bg-red-100',    text: 'text-red-700'    },
};

function PagBadge({ status }: { status: string }) {
  const s = STATUS_PAG[status] ?? { label: status, bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400', iconBg: 'bg-gray-100' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.dot}`} />
      {s.label}
    </span>
  );
}

function CliBadge({ status }: { status?: string }) {
  if (!status) return null;
  const s = STATUS_CLI[status] ?? { label: status, bg: 'bg-gray-100', text: 'text-gray-600' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  );
}

// ─── Helpers de formatação ────────────────────────────────────────────────────

function mascaraCpf(cpf: string): string {
  const d = (cpf ?? '').replace(/\D/g, '');
  if (d.length !== 11) return cpf ?? '';
  return `${d.slice(0, 3)}.***.***-${d.slice(9)}`;
}

function formatarTelefone(tel: string): string {
  const d = (tel ?? '').replace(/\D/g, '');
  if (d.length === 11) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;
  return tel;
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function ModalDetalhesPedido({ pedidoId, onClose }: { pedidoId: string; onClose: () => void }) {
  const [pedido, setPedido] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [avancando, setAvancando] = useState(false);
  const [estornando, setEstornando] = useState(false);
  const [confirmarEstorno, setConfirmarEstorno] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/pedidos/${pedidoId}`)
      .then(r => r.json())
      .then(data => { setPedido(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [pedidoId]);

  const imprimirCupom = () => {
    if (!pedido) return;
    const w = window.open('', '_blank', 'width=320,height=800');
    if (!w) return;

    const dataHora = new Date(pedido.criadoEm).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });

    const itensHtml = pedido.items.map((i: any) => {
      const nome = i.nomeProduto.length > 28 ? i.nomeProduto.substring(0, 26) + '..' : i.nomeProduto;
      const subtotal = formatarMoeda(i.subtotal);
      const unitario = `${i.quantidade} x ${formatarMoeda(i.preco)}`;
      return `
        <div class="item-nome">${nome}</div>
        <div class="row"><span class="indent">${unitario}</span><span>${subtotal}</span></div>
      `;
    }).join('');

    const enderecoEntrega = pedido.entregaTipo === 'ENTREGA'
      ? `
        <div class="section-title">ENDERECO DE ENTREGA</div>
        <div class="sep"></div>
        <div>${pedido.logradouro || ''}, ${pedido.numero || ''}${pedido.complemento ? ' - ' + pedido.complemento : ''}</div>
        <div>${pedido.bairro || ''}</div>
        <div>${pedido.cidade || ''} - ${pedido.uf || ''} &nbsp; CEP: ${pedido.cep || ''}</div>
      `
      : `
        <div class="section-title">RETIRADA EM LOJA</div>
        <div class="sep"></div>
        <div>Av. XVII, 404 - Sen. Carlos Jereissati</div>
        <div>Pacatuba - CE &nbsp; CEP: 61800-000</div>
        <div>Tel: (85) 99113-5449</div>
        <div class="obs">Aguarde o aviso de liberacao para retirada.</div>
      `;

    w.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Cupom #${pedido.id.slice(-8).toUpperCase()}</title>
  <style>
    @page {
      size: 80mm auto;
      margin: 4mm 3mm;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: 11px;
      width: 72mm;
      color: #000;
      line-height: 1.45;
    }
    .center   { text-align: center; }
    .right    { text-align: right; }
    .bold     { font-weight: bold; }
    .big      { font-size: 14px; font-weight: bold; }
    .small    { font-size: 9px; }
    .sep      { border-bottom: 1px dotted #000; margin: 5px 0; }
    .row      { display: flex; justify-content: space-between; align-items: baseline; }
    .indent   { padding-left: 8px; color: #333; }
    .item-nome{ font-weight: bold; margin-top: 5px; }
    .section-title {
      font-weight: bold;
      font-size: 10px;
      letter-spacing: 0.5px;
      margin-top: 6px;
    }
    .total-box {
      border: 1px solid #000;
      padding: 4px 6px;
      margin: 6px 0;
    }
    .total-valor { font-size: 15px; font-weight: bold; }
    .obs { font-size: 9px; color: #444; margin-top: 3px; font-style: italic; }
    .rodape { font-size: 9px; text-align: center; margin-top: 8px; color: #333; }
    @media print {
      body { width: 72mm; }
    }
  </style>
</head>
<body>

  <!-- CABEÇALHO -->
  <div class="center">
    <div class="big">SUPERMERCADO G&amp;N</div>
    <div class="small">CNPJ: 08.143.625/0001-14</div>
    <div class="small">Av. XVII, 404 - Sen. Carlos Jereissati</div>
    <div class="small">Pacatuba - CE &nbsp; CEP: 61800-000</div>
    <div class="small">Tel: (85) 99113-5449</div>
  </div>

  <div class="sep" style="margin-top:6px"></div>
  <div class="center bold" style="font-size:12px; letter-spacing:1px;">CUPOM NAO FISCAL</div>
  <div class="sep"></div>

  <!-- PEDIDO -->
  <div class="row">
    <span class="bold">Pedido Nº:</span>
    <span class="bold">#${pedido.id.slice(-8).toUpperCase()}</span>
  </div>
  <div class="row">
    <span>Data/Hora:</span>
    <span>${dataHora}</span>
  </div>

  <div class="sep"></div>

  <!-- CLIENTE -->
  <div class="section-title">DADOS DO CLIENTE</div>
  <div class="sep"></div>
  <div class="row"><span>Nome:</span><span>${pedido.compradorNome}</span></div>
  <div class="row"><span>CPF:</span><span>${mascaraCpf(pedido.compradorCpf)}</span></div>
  <div class="row"><span>Tel:</span><span>${formatarTelefone(pedido.compradorTelefone)}</span></div>

  <div class="sep"></div>

  <!-- ITENS -->
  <div class="section-title">ITENS DO PEDIDO</div>
  <div class="sep"></div>
  ${itensHtml}

  <div class="sep"></div>

  <!-- TOTAIS -->
  <div class="row"><span>Subtotal:</span><span>${formatarMoeda(pedido.subtotal)}</span></div>
  <div class="row">
    <span>Frete:</span>
    <span>${pedido.frete === 0 ? 'GRATIS' : formatarMoeda(pedido.frete)}</span>
  </div>
  <div class="sep"></div>
  <div class="total-box">
    <div class="row">
      <span class="bold" style="font-size:13px;">TOTAL</span>
      <span class="total-valor">${formatarMoeda(pedido.total)}</span>
    </div>
  </div>

  <!-- PAGAMENTO -->
  <div class="section-title">FORMA DE PAGAMENTO</div>
  <div class="sep"></div>
  <div class="row">
    <span>Metodo:</span>
    <span class="bold">${pedido.metodoPagamento}</span>
  </div>
  <div class="row">
    <span>Status Pag.:</span>
    <span class="bold">${
      pedido.status === 'PAID'            ? 'PAGO'       :
      pedido.status === 'PENDING_PAYMENT' ? 'AGUARDANDO' :
      pedido.status === 'CANCELLED'       ? 'CANCELADO'  :
      pedido.status === 'FAILED'          ? 'FALHOU'     : pedido.status
    }</span>
  </div>

  <div class="sep"></div>

  <!-- ENTREGA / RETIRADA -->
  ${enderecoEntrega}

  <div class="sep" style="margin-top:8px"></div>

  <!-- RODAPÉ -->
  <div class="rodape">
    <div>Obrigado pela preferencia!</div>
    <div>Volte sempre ao Supermercado G&amp;N</div>
    <div style="margin-top:4px;">www.digitalgen.vercel.app</div>
    <div style="margin-top:6px; font-size:8px;">
      Documento emitido em ${new Date().toLocaleString('pt-BR')}
    </div>
  </div>

  <script>
    window.onload = function() {
      window.print();
      setTimeout(function(){ window.close(); }, 1000);
    };
  </script>
</body>
</html>`);
    w.document.close();
  };

  const avancarStatus = async () => {
    if (!pedido || pedido.statusCliente !== 'EM_SEPARACAO') return;
    setAvancando(true);
    try {
      const res = await fetch(`/api/admin/pedidos/${pedidoId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statusCliente: 'LIBERADO' }),
      });
      if (res.ok) setPedido({ ...pedido, statusCliente: 'LIBERADO' });
    } catch (e) {
      console.error(e);
    } finally {
      setAvancando(false);
    }
  };

  const executarEstorno = async () => {
    if (!pedido) return;
    setEstornando(true);
    setConfirmarEstorno(false);
    try {
      const res = await fetch(`/api/admin/pedidos/${pedidoId}/reembolso`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setPedido({ ...pedido, status: 'CANCELLED', statusCliente: 'CANCELADO' });
      } else {
        alert(`Erro ao estornar: ${data.error ?? 'Erro desconhecido'}`);
      }
    } catch (e) {
      console.error(e);
      alert('Erro de conexão ao tentar estornar.');
    } finally {
      setEstornando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-green-600/30">
              <ShoppingBag size={18} className="text-white" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none mb-0.5">Detalhes do pedido</p>
              <h2 className="text-lg font-extrabold text-gray-900 leading-none">#{pedidoId.slice(-8).toUpperCase()}</h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={imprimirCupom}
              disabled={!pedido}
              className="hidden sm:flex items-center gap-1.5 h-9 px-3.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-600 hover:text-gray-900 rounded-xl text-xs font-bold transition-all disabled:opacity-40"
            >
              <Printer size={13} /> Imprimir
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 rounded-xl transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ── Conteúdo scrollável ── */}
        <div className="overflow-y-auto flex-1 p-4 sm:p-5 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="animate-spin text-green-600" size={28} />
              <p className="text-sm text-gray-400 font-medium">Carregando pedido…</p>
            </div>
          ) : !pedido ? (
            <div className="flex flex-col items-center gap-2 py-12">
              <p className="text-sm font-semibold text-red-500">Erro ao carregar os detalhes do pedido.</p>
            </div>
          ) : (
            <>
              {/* ── Grid: Comprador + Pagamento ── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                {/* ── Card Comprador ── */}
                <div className="rounded-xl border border-gray-200 overflow-hidden">
                  {/* Header */}
                  <div className="flex items-center gap-2.5 px-4 py-3 bg-blue-50/70 border-b border-blue-100">
                    <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
                      <User size={13} className="text-white" />
                    </div>
                    <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wider flex-1">Comprador</h3>
                    {pedido.cliente && (
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                        Cadastrado
                      </span>
                    )}
                  </div>

                  {/* Avatar + nome */}
                  <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white">
                    <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 text-white font-extrabold text-sm">
                      {pedido.compradorNome?.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900 leading-tight truncate">{pedido.compradorNome}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">Cliente</p>
                    </div>
                  </div>

                  {/* Linhas label → valor */}
                  <div className="divide-y divide-gray-50">
                    <div className="flex items-center px-4 py-2.5 gap-3">
                      <Mail size={12} className="text-gray-300 flex-shrink-0" />
                      <span className="text-[11px] text-gray-400 w-10 flex-shrink-0">Email</span>
                      <span className="text-xs font-medium text-gray-800 truncate">{pedido.compradorEmail}</span>
                    </div>
                    <div className="flex items-center px-4 py-2.5 gap-3">
                      <Phone size={12} className="text-gray-300 flex-shrink-0" />
                      <span className="text-[11px] text-gray-400 w-10 flex-shrink-0">Tel.</span>
                      <span className="text-xs font-medium text-gray-800">{formatarTelefone(pedido.compradorTelefone)}</span>
                    </div>
                    <div className="flex items-center px-4 py-2.5 gap-3">
                      <FileText size={12} className="text-gray-300 flex-shrink-0" />
                      <span className="text-[11px] text-gray-400 w-10 flex-shrink-0">CPF</span>
                      <span className="text-xs font-medium text-gray-800 tracking-wide">{mascaraCpf(pedido.compradorCpf)}</span>
                    </div>
                  </div>
                </div>

                {/* ── Card Pagamento & Entrega ── */}
                <div className="rounded-xl border border-gray-200 overflow-hidden">
                  {/* Header */}
                  <div className="flex items-center gap-2.5 px-4 py-3 bg-green-50/70 border-b border-green-100">
                    <div className="w-7 h-7 rounded-lg bg-green-600 flex items-center justify-center flex-shrink-0">
                      <CreditCard size={13} className="text-white" />
                    </div>
                    <h3 className="text-xs font-bold text-green-900 uppercase tracking-wider">Pagamento & Entrega</h3>
                  </div>

                  {/* Linhas */}
                  <div className="divide-y divide-gray-50">
                    <div className="flex items-center justify-between px-4 py-2.5 gap-2">
                      <span className="text-[11px] text-gray-400 flex-shrink-0">Método</span>
                      <span className="text-xs font-semibold text-gray-900">{pedido.metodoPagamento}</span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-2.5 gap-2">
                      <span className="text-[11px] text-gray-400 flex-shrink-0">Tipo de entrega</span>
                      <span className="text-xs font-semibold text-gray-900">
                        {pedido.entregaTipo === 'RETIRADA' ? 'Retirada em loja' : 'Entrega em domicílio'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-2.5 gap-2">
                      <span className="text-[11px] text-gray-400 flex-shrink-0">Status pagamento</span>
                      <PagBadge status={pedido.status} />
                    </div>
                    <div className="flex items-center justify-between px-4 py-2.5 gap-2">
                      <span className="text-[11px] text-gray-400 flex-shrink-0">Status pedido</span>
                      <CliBadge status={pedido.statusCliente} />
                    </div>
                  </div>

                  {/* Bloco de endereço */}
                  {pedido.entregaTipo === 'ENTREGA' && pedido.logradouro && (
                    <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50">
                      <div className="flex items-start gap-2.5">
                        <Truck size={13} className="text-green-500 mt-0.5 flex-shrink-0" />
                        <div className="space-y-0.5">
                          <p className="text-xs font-semibold text-gray-800">
                            {pedido.logradouro}, {pedido.numero}{pedido.complemento ? ` — ${pedido.complemento}` : ''}
                          </p>
                          <p className="text-[11px] text-gray-500">{pedido.bairro} · {pedido.cidade} - {pedido.uf}</p>
                          <p className="text-[11px] text-gray-400">CEP {pedido.cep}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {pedido.entregaTipo === 'RETIRADA' && (
                    <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50">
                      <div className="flex items-start gap-2.5">
                        <Store size={13} className="text-green-500 mt-0.5 flex-shrink-0" />
                        <div className="space-y-0.5">
                          <p className="text-xs font-semibold text-gray-800">Av. XVII, 404 — Sen. Carlos Jereissati</p>
                          <p className="text-[11px] text-gray-500">Pacatuba - CE · CEP 61800-000</p>
                          <p className="text-[11px] text-gray-400">(85) 99113-5449</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Progresso ── */}
              <div className="rounded-xl border border-gray-200 overflow-hidden">
                <div className="flex items-center gap-2.5 px-4 py-3 bg-violet-50/60 border-b border-violet-100">
                  <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center flex-shrink-0">
                    <Package size={13} className="text-white" />
                  </div>
                  <h3 className="text-xs font-bold text-violet-900 uppercase tracking-wider">Progresso do Pedido</h3>
                </div>
                <div className="p-4">
                  <OrderTimeline statusAtual={pedido.statusCliente ?? pedido.status} entregaTipo={pedido.entregaTipo} />

                  {(pedido.statusCliente === 'EM_SEPARACAO' || pedido.status === 'PAID') && (
                    <div className="mt-5 pt-4 border-t border-gray-100 flex flex-wrap items-center justify-end gap-2.5">

                      {/* Botão Extornar */}
                      {pedido.status === 'PAID' && pedido.statusCliente !== 'CANCELADO' && (
                        confirmarEstorno ? (
                          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 w-full sm:w-auto">
                            <span className="text-xs font-bold text-red-700 flex-1">Confirmar estorno?</span>
                            <button
                              onClick={executarEstorno}
                              disabled={estornando}
                              className="flex items-center gap-1.5 h-8 px-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold rounded-lg text-xs transition-all"
                            >
                              {estornando ? <Loader2 size={11} className="animate-spin" /> : <RotateCcw size={11} />}
                              Confirmar
                            </button>
                            <button
                              onClick={() => setConfirmarEstorno(false)}
                              className="h-8 px-3 text-xs font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmarEstorno(true)}
                            disabled={estornando}
                            className="flex items-center gap-2 h-10 px-4 bg-white hover:bg-red-50 border border-red-200 hover:border-red-300 text-red-600 font-bold rounded-xl text-sm transition-all"
                          >
                            <RotateCcw size={14} />
                            Extornar Pagamento
                          </button>
                        )
                      )}

                      {/* Botão Avançar */}
                      {pedido.statusCliente === 'EM_SEPARACAO' && (
                        <button
                          onClick={avancarStatus}
                          disabled={avancando}
                          className="flex items-center gap-2 h-10 px-5 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-green-600/25 hover:-translate-y-0.5 active:translate-y-0"
                        >
                          {avancando ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
                          {pedido.entregaTipo === 'RETIRADA' ? 'Liberar para Retirada' : 'Saiu para Entrega'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* ── Itens ── */}
              <div className="rounded-xl border border-gray-200 overflow-hidden">
                <div className="flex items-center gap-2.5 px-4 py-3 bg-orange-50/60 border-b border-orange-100">
                  <div className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center flex-shrink-0">
                    <ShoppingBag size={13} className="text-white" />
                  </div>
                  <h3 className="text-xs font-bold text-orange-900 uppercase tracking-wider">Itens do Pedido</h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {pedido.items?.map((item: any) => (
                    <div key={item.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50/50 transition-colors">
                      <div className="w-11 h-11 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 border border-gray-200 flex items-center justify-center">
                        {item.imagemProduto
                          ? <img src={item.imagemProduto} alt={item.nomeProduto} className="w-full h-full object-contain p-1" />
                          : <ShoppingBag size={16} className="text-gray-300" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{item.nomeProduto}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{item.quantidade}× {formatarMoeda(item.preco)}</p>
                      </div>
                      <p className="text-sm font-bold text-gray-900 flex-shrink-0 tabular-nums">{formatarMoeda(item.subtotal)}</p>
                    </div>
                  ))}
                </div>

                {/* Totais */}
                <div className="px-4 py-4 bg-gray-50/70 border-t border-gray-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Subtotal</span>
                    <span className="text-xs font-semibold text-gray-700 tabular-nums">{formatarMoeda(pedido.subtotal)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Frete</span>
                    <span className={`text-xs font-semibold tabular-nums ${pedido.frete === 0 ? 'text-green-600' : 'text-gray-700'}`}>
                      {pedido.frete === 0 ? 'Grátis' : formatarMoeda(pedido.frete)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                    <span className="text-sm font-bold text-gray-900">Total</span>
                    <span className="text-base font-extrabold text-green-600 tabular-nums">{formatarMoeda(pedido.total)}</span>
                  </div>
                </div>
              </div>

              {/* Botão imprimir mobile */}
              <button
                onClick={imprimirCupom}
                className="sm:hidden w-full flex items-center justify-center gap-2 h-11 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-xl text-sm font-bold transition-colors"
              >
                <Printer size={15} /> Imprimir Cupom
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Filtros ──────────────────────────────────────────────────────────────────

const FILTROS = [
  { value: '',               label: 'Todos'       },
  { value: 'PENDING_PAYMENT', label: 'Aguardando'  },
  { value: 'PROCESSING',      label: 'Processando' },
  { value: 'PAID',            label: 'Pago'        },
  { value: 'FAILED',          label: 'Falhou'      },
  { value: 'CANCELLED',       label: 'Cancelado'   },
];

function PageFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const atual = searchParams.get('status') ?? '';

  const set = (value: string) => {
    const p = new URLSearchParams(searchParams.toString());
    value ? p.set('status', value) : p.delete('status');
    p.delete('page');
    startTransition(() => {
      router.replace(`${pathname}?${p.toString()}`);
    });
  };

  return (
    <div className={`flex flex-wrap gap-2 transition-opacity ${isPending ? 'opacity-60' : 'opacity-100'}`}>
      {FILTROS.map(f => (
        <button
          key={f.value}
          onClick={() => set(f.value)}
          disabled={isPending}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            atual === f.value
              ? 'bg-green-600 text-white shadow-lg shadow-green-600/20'
              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:cursor-wait'
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}

// ─── Filtro de data ───────────────────────────────────────────────────────────

const DATAS = [
  { value: 'hoje',   label: 'Hoje',           desc: 'pedidos de hoje'        },
  { value: 'ontem',  label: 'Ontem',          desc: 'pedidos de ontem'       },
  { value: 'semana', label: 'Últimos 7 dias', desc: 'pedidos da semana'      },
  { value: '',       label: 'Todas as datas', desc: 'sem filtro de data'     },
];

function DateFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const atual = searchParams.get('data') ?? '';

  const set = (value: string) => {
    const p = new URLSearchParams(searchParams.toString());
    value ? p.set('data', value) : p.delete('data');
    p.delete('page');
    startTransition(() => { router.replace(`${pathname}?${p.toString()}`); });
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 transition-opacity ${isPending ? 'opacity-60' : ''}`}>
      <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 mr-1">
        <CalendarDays size={13} />
        <span>Data</span>
      </div>
      {DATAS.map(d => (
        <button
          key={d.value}
          onClick={() => set(d.value)}
          disabled={isPending}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            atual === d.value
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:cursor-wait'
          }`}
        >
          {d.label}
        </button>
      ))}
    </div>
  );
}

// ─── Lista principal ──────────────────────────────────────────────────────────

function PedidosContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [pedidos, setPedidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [pedidoSelecionado, setPedidoSelecionado] = useState<string | null>(null);
  const [novos, setNovos] = useState(0);
  const referenceIdRef = useRef<string | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    setNovos(0);
    try {
      const q = new URLSearchParams(searchParams.toString());
      if (!q.get('page')) q.set('page', '1');
      const res = await fetch(`/api/admin/pedidos?${q.toString()}`);
      const json = await res.json();
      setPedidos(json.pedidos ?? []);
      setPagination({ page: json.page, totalPages: json.pages, total: json.total });
      if (json.pedidos?.[0]) referenceIdRef.current = json.pedidos[0].id;
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => { carregar(); }, [carregar]);

  // Polling: verifica novos pedidos a cada 10 s
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/admin/pedidos/ping');
        const { ultimoId } = await res.json();
        if (referenceIdRef.current && ultimoId && ultimoId !== referenceIdRef.current) {
          setNovos(n => n + 1);
          referenceIdRef.current = ultimoId; // evita contar o mesmo pedido mais de uma vez
        }
      } catch { /* silencioso */ }
    }, 10_000);
    return () => clearInterval(interval);
  }, []);

  const setPage = (page: number) => {
    const p = new URLSearchParams(searchParams.toString());
    p.set('page', String(page));
    router.push(`${pathname}?${p.toString()}`);
  };

  return (
    <div className="space-y-6 pb-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pedidos</h1>
          <p className="text-sm text-gray-400 mt-0.5">{pagination.total} pedido(s) encontrado(s)</p>
        </div>
      </div>

      {/* Filtro de data */}
      <Suspense fallback={<div className="h-10" />}>
        <DateFilters />
      </Suspense>

      {/* Filtros de status */}
      <Suspense fallback={<div className="h-10" />}>
        <PageFilters />
      </Suspense>

      {/* Banner: novo pedido em tempo real */}
      {novos > 0 && !loading && (
        <button
          onClick={carregar}
          className="w-full flex items-center justify-center gap-2.5 py-3 px-4 bg-green-50 hover:bg-green-100 border border-green-300 text-green-800 text-sm font-bold rounded-xl transition-colors"
        >
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
          <Bell size={15} />
          {novos === 1 ? 'Novo pedido recebido!' : `${novos} novos pedidos!`} — Clique para atualizar
        </button>
      )}

      {/* Lista */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

        {loading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="animate-spin text-green-600" size={28} />
          </div>
        ) : pedidos.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16">
            <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center">
              <Package size={24} className="text-gray-300" />
            </div>
            <p className="text-sm font-semibold text-gray-400">Nenhum pedido encontrado</p>
          </div>
        ) : (
          <>
            {/* Cabeçalho das colunas */}
            <div className="flex items-center gap-4 px-6 py-3 bg-gray-50 border-b border-gray-100">
              <div className="hidden sm:block w-10 flex-shrink-0" />
              <div className="w-[100px] flex-shrink-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Nº Pedido</span>
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Comprador</span>
              </div>
              <div className="hidden lg:block w-[100px] flex-shrink-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Pagamento</span>
              </div>
              <div className="w-[130px] flex-shrink-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Status</span>
              </div>
              <div className="w-[80px] flex-shrink-0 text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Valor</span>
              </div>
              <div className="w-14 flex-shrink-0 text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Ação</span>
              </div>
            </div>

            {/* Linhas de dados */}
            <div className="divide-y divide-gray-50">
              {pedidos.map(pedido => {
                const pag = STATUS_PAG[pedido.status] ?? STATUS_PAG.PENDING_PAYMENT;
                return (
                  <div
                    key={pedido.id}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/60 transition-colors group"
                  >
                    {/* Ícone colorido */}
                    <div className={`hidden sm:flex w-10 h-10 rounded-xl items-center justify-center flex-shrink-0 ${pag.iconBg}`}>
                      <ShoppingBag size={17} className={pag.text} />
                    </div>

                    {/* Nº Pedido + data */}
                    <div className="w-[100px] flex-shrink-0">
                      <p className="text-xs font-mono font-bold text-gray-900 group-hover:text-green-700 transition-colors">
                        #{pedido.id.slice(-8).toUpperCase()}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {new Date(pedido.criadoEm).toLocaleDateString('pt-BR')}
                      </p>
                    </div>

                    {/* Comprador */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{pedido.compradorNome}</p>
                      <p className="text-xs text-gray-400 truncate">{pedido.compradorEmail}</p>
                    </div>

                    {/* Pagamento + entrega */}
                    <div className="hidden lg:block w-[100px] flex-shrink-0">
                      <p className="text-xs font-medium text-gray-700">{pedido.metodoPagamento}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{pedido.entregaTipo}</p>
                    </div>

                    {/* Status */}
                    <div className="w-[130px] flex-shrink-0">
                      <PagBadge status={pedido.status} />
                    </div>

                    {/* Valor */}
                    <div className="w-[80px] flex-shrink-0 text-right">
                      <p className="text-sm font-bold text-gray-900">{formatarMoeda(pedido.total)}</p>
                    </div>

                    {/* Ação */}
                    <div className="w-14 flex-shrink-0 flex justify-center">
                      <button
                        onClick={() => setPedidoSelecionado(pedido.id)}
                        className="px-3 py-1.5 bg-green-50 hover:bg-green-600 hover:text-white text-green-700 rounded-lg text-xs font-bold transition-all"
                      >
                        Ver
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Paginação */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-50 bg-gray-50/40">
            <p className="text-xs text-gray-500">
              Página <span className="font-bold text-gray-700">{pagination.page}</span> de {pagination.totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={pagination.page === 1 || loading}
                onClick={() => setPage(pagination.page - 1)}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:text-green-600 hover:border-green-200 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                disabled={pagination.page === pagination.totalPages || loading}
                onClick={() => setPage(pagination.page + 1)}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:text-green-600 hover:border-green-200 disabled:opacity-40 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {pedidoSelecionado && (
        <ModalDetalhesPedido
          pedidoId={pedidoSelecionado}
          onClose={() => { setPedidoSelecionado(null); carregar(); }}
        />
      )}
    </div>
  );
}

export default function AdminPedidosPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-16"><Loader2 className="animate-spin text-green-600" size={28} /></div>}>
      <PedidosContent />
    </Suspense>
  );
}
