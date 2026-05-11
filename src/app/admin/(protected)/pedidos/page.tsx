'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
  Loader2, Printer, ArrowRight, X, Package,
  User, CreditCard, MapPin, ChevronLeft, ChevronRight, ShoppingBag, RotateCcw,
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

// ─── Modal ────────────────────────────────────────────────────────────────────

export function ModalDetalhesPedido({ pedidoId, onClose }: { pedidoId: string; onClose: () => void }) {
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
    const w = window.open('', '_blank', 'width=400,height=600');
    if (!w) return;
    w.document.write(`
      <html>
        <head>
          <title>Cupom #${pedido.id.slice(-8).toUpperCase()}</title>
          <style>
            @page { margin: 0; }
            body { font-family: monospace; width: 80mm; margin: 0 auto; padding: 10px; font-size: 12px; }
            .center { text-align: center; } .bold { font-weight: bold; }
            .sep { border-bottom: 1px dashed #000; padding-bottom: 5px; margin-bottom: 5px; }
            .row { display: flex; justify-content: space-between; }
          </style>
        </head>
        <body>
          <div class="center bold sep">EKOMART<br>Pedido #${pedido.id.slice(-8).toUpperCase()}</div>
          <div class="sep">
            Cliente: ${pedido.compradorNome}<br>
            Data: ${new Date(pedido.criadoEm).toLocaleString('pt-BR')}
          </div>
          <div class="sep">
            ${pedido.items.map((i: any) => `<div class="row"><span>${i.quantidade}x ${i.nomeProduto.substring(0, 18)}</span><span>${formatarMoeda(i.subtotal)}</span></div>`).join('')}
          </div>
          <div class="row bold"><span>TOTAL</span><span>${formatarMoeda(pedido.total)}</span></div>
          <script>window.onload = () => { window.print(); window.close(); }</script>
        </body>
      </html>
    `);
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* Header fixo */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Pedido</p>
            <h2 className="text-xl font-bold text-gray-900">#{pedidoId.slice(-8).toUpperCase()}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={imprimirCupom}
              disabled={!pedido}
              className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold transition-colors disabled:opacity-40"
            >
              <Printer size={14} /> Imprimir
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-xl transition-colors"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {/* Conteúdo scrollável */}
        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="animate-spin text-green-600" size={28} />
            </div>
          ) : !pedido ? (
            <p className="text-red-500 text-sm p-6">Erro ao carregar os detalhes do pedido.</p>
          ) : (
            <div className="p-5 space-y-4">

              {/* Grid: comprador + pagamento */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Comprador */}
                <div className="bg-white rounded-xl border border-gray-100 p-4">
                  <div className="flex items-center gap-2 mb-3 pb-2.5 border-b border-gray-50">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <User size={14} className="text-blue-600" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-900">Comprador</h3>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-sm font-semibold text-gray-900">{pedido.compradorNome}</p>
                    <p className="text-xs text-gray-500">{pedido.compradorEmail}</p>
                    <p className="text-xs text-gray-500">CPF: {pedido.compradorCpf}</p>
                    <p className="text-xs text-gray-500">Tel: {pedido.compradorTelefone}</p>
                    {pedido.cliente && (
                      <span className="inline-block mt-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                        Cliente cadastrado
                      </span>
                    )}
                  </div>
                </div>

                {/* Pagamento e Entrega */}
                <div className="bg-white rounded-xl border border-gray-100 p-4">
                  <div className="flex items-center gap-2 mb-3 pb-2.5 border-b border-gray-50">
                    <div className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                      <CreditCard size={14} className="text-green-600" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-900">Pagamento & Entrega</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Método</span>
                      <span className="text-xs font-semibold text-gray-900">{pedido.metodoPagamento}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Status Pagamento</span>
                      <PagBadge status={pedido.status} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Status Pedido</span>
                      <CliBadge status={pedido.statusCliente} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Tipo Entrega</span>
                      <span className="text-xs font-semibold text-gray-900">{pedido.entregaTipo}</span>
                    </div>
                    {pedido.entregaTipo === 'ENTREGA' && (
                      <div className="mt-1 pt-2 border-t border-gray-50">
                        <div className="flex items-start gap-1.5">
                          <MapPin size={12} className="text-gray-400 mt-0.5 flex-shrink-0" />
                          <p className="text-[11px] text-gray-500 leading-relaxed">
                            {pedido.logradouro}, {pedido.numero}{pedido.complemento ? ` - ${pedido.complemento}` : ''}<br />
                            {pedido.bairro}, {pedido.cidade} - {pedido.uf}<br />
                            CEP: {pedido.cep}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Progresso */}
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex items-center gap-2 mb-3 pb-2.5 border-b border-gray-50">
                  <div className="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center flex-shrink-0">
                    <Package size={14} className="text-violet-600" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-900">Progresso do Pedido</h3>
                </div>
                <OrderTimeline statusAtual={pedido.statusCliente ?? pedido.status} entregaTipo={pedido.entregaTipo} />
                {(pedido.statusCliente === 'EM_SEPARACAO' || pedido.status === 'PAID') && (
                  <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
                    {/* Estorno — disponível para qualquer pedido PAID não cancelado */}
                    {pedido.status === 'PAID' && pedido.statusCliente !== 'CANCELADO' && (
                      confirmarEstorno ? (
                        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
                          <span className="text-xs font-semibold text-red-700">Confirmar estorno?</span>
                          <button
                            onClick={executarEstorno}
                            disabled={estornando}
                            className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-all"
                          >
                            {estornando ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />}
                            Confirmar
                          </button>
                          <button
                            onClick={() => setConfirmarEstorno(false)}
                            className="text-xs font-semibold text-gray-500 hover:text-gray-700 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmarEstorno(true)}
                          disabled={estornando}
                          className="flex items-center gap-2 bg-white hover:bg-red-50 border border-red-200 text-red-600 font-bold px-4 py-2.5 rounded-xl text-sm transition-all hover:border-red-300"
                        >
                          <RotateCcw size={14} />
                          Extornar Pagamento
                        </button>
                      )
                    )}

                    {/* Avançar status — só quando EM_SEPARACAO */}
                    {pedido.statusCliente === 'EM_SEPARACAO' && (
                      <button
                        onClick={avancarStatus}
                        disabled={avancando}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-green-600/25 hover:-translate-y-0.5"
                      >
                        {avancando ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
                        {pedido.entregaTipo === 'RETIRADA' ? 'Marcar como Liberado para Retirada' : 'Marcar como Saiu para Entrega'}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Itens */}
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-50">
                  <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
                    <ShoppingBag size={14} className="text-orange-500" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-900">Itens do Pedido</h3>
                </div>
                <div className="divide-y divide-gray-50">
                  {pedido.items?.map((item: any) => (
                    <div key={item.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50/60 transition-colors">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100">
                        {item.imagemProduto && (
                          <img src={item.imagemProduto} alt={item.nomeProduto} className="w-full h-full object-contain p-1" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{item.nomeProduto}</p>
                        <p className="text-xs text-gray-400">{item.quantidade}× {formatarMoeda(item.preco)}</p>
                      </div>
                      <p className="text-sm font-bold text-gray-900 flex-shrink-0">{formatarMoeda(item.subtotal)}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-gray-50/60 px-4 py-3 space-y-1.5">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Subtotal</span>
                    <span>{formatarMoeda(pedido.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Frete</span>
                    <span>{pedido.frete === 0 ? 'Grátis' : formatarMoeda(pedido.frete)}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-gray-900 pt-1.5 border-t border-gray-200">
                    <span>Total</span>
                    <span className="text-green-600">{formatarMoeda(pedido.total)}</span>
                  </div>
                </div>
              </div>

            </div>
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
  const atual = searchParams.get('status') ?? '';

  const set = (value: string) => {
    const p = new URLSearchParams(searchParams.toString());
    value ? p.set('status', value) : p.delete('status');
    p.set('page', '1');
    router.push(`${pathname}?${p.toString()}`);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {FILTROS.map(f => (
        <button
          key={f.value}
          onClick={() => set(f.value)}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            atual === f.value
              ? 'bg-green-600 text-white shadow-lg shadow-green-600/20'
              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          {f.label}
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

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams(searchParams.toString());
      if (!q.get('page')) q.set('page', '1');
      const res = await fetch(`/api/admin/pedidos?${q.toString()}`);
      const json = await res.json();
      setPedidos(json.pedidos ?? []);
      setPagination({ page: json.page, totalPages: json.pages, total: json.total });
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => { carregar(); }, [carregar]);

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

      {/* Filtros */}
      <PageFilters />

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
