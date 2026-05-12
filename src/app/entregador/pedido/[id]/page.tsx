'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { ChevronLeft, MapPin, Navigation, Phone, Copy, Loader2, CheckCircle } from 'lucide-react';
import { useEntregador } from '@/src/hooks/useEntregador';

interface PedidoDetalhe {
  id: string;
  statusCliente: string;
  compradorNome: string;
  compradorTelefone: string;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  referencia: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  cep: string | null;
  subtotal: number;
  frete: number;
  total: number;
  entregadorId: string | null;
  aceitoEm: string | null;
  entregueEm: string | null;
  items: { nomeProduto: string; quantidade: number; preco: number; subtotal: number; imagemProduto: string }[];
}

function formatarMoeda(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatarTelefone(t: string) {
  const d = t.replace(/\D/g, '');
  if (d.length === 11) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
  return t;
}


export default function PedidoDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { entregador, loading: loadingAuth } = useEntregador();
  const [pedido, setPedido] = useState<PedidoDetalhe | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [aceitando, setAceitando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (!entregador) return;
    fetch(`/api/entregador/pedidos/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setPedido(data); })
      .finally(() => setCarregando(false));
  }, [id, entregador]);

  async function handleAceitar() {
    if (!pedido) return;
    setAceitando(true);
    const res = await fetch(`/api/entregador/pedidos/${id}/aceitar`, { method: 'PATCH' });
    if (res.ok) {
      router.push(`/entregador/pedido/${id}/mapa`);
    } else {
      setAceitando(false);
    }
  }

  async function handleConfirmar() {
    setConfirmando(true);
    const res = await fetch(`/api/entregador/pedidos/${id}/confirmar-entrega`, { method: 'PATCH' });
    if (res.ok) {
      setModalAberto(false);
      router.push('/entregador');
    }
    setConfirmando(false);
  }

  function copiarTelefone() {
    if (!pedido) return;
    navigator.clipboard.writeText(pedido.compradorTelefone);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  if (loadingAuth || carregando) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!pedido) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">Pedido não encontrado</p>
      </div>
    );
  }

  const meuPedido = pedido.entregadorId === entregador?.id;

  return (
    <div className="min-h-screen bg-gray-50 pb-28">

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3 px-4 h-14">
          <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-700 transition-colors">
            <ChevronLeft size={24} />
          </button>
          <span className="text-gray-900 font-bold">Pedido #{pedido.id.slice(0, 8)}</span>
          <span className="ml-auto text-green-600 font-bold">{formatarMoeda(pedido.total)}</span>
        </div>
      </header>

      <div className="px-4 py-4 space-y-3">

        {/* Endereço */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <MapPin size={16} className="text-green-500" />
            <h2 className="text-gray-900 font-bold text-sm">Endereço de Entrega</h2>
          </div>
          <p className="text-gray-700 text-sm">
            {pedido.logradouro}, {pedido.numero}
            {pedido.complemento && ` — ${pedido.complemento}`}
          </p>
          <p className="text-gray-500 text-sm">{pedido.bairro} · {pedido.cidade} - {pedido.uf}</p>
          {pedido.cep && <p className="text-gray-400 text-xs mt-1">CEP: {pedido.cep}</p>}
          {pedido.referencia && <p className="text-gray-400 text-xs mt-1">Ref: {pedido.referencia}</p>}
        </div>

        {/* Botão Mapa */}
        <button
          onClick={() => router.push(`/entregador/pedido/${id}/mapa`)}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-colors shadow-sm"
        >
          <Navigation size={18} /> Ver Rota no Mapa
        </button>

        {/* Itens */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
          <h2 className="text-gray-900 font-bold text-sm mb-3">Itens do Pedido</h2>
          <div className="space-y-3">
            {pedido.items.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                  <Image src={item.imagemProduto} alt={item.nomeProduto} fill className="object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-800 text-sm font-medium truncate">{item.nomeProduto}</p>
                  <p className="text-gray-400 text-xs">x{item.quantidade}</p>
                </div>
                <p className="text-gray-700 text-sm font-bold flex-shrink-0">{formatarMoeda(item.preco)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Valores */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm space-y-2 text-sm">
          <div className="flex justify-between text-gray-500">
            <span>Subtotal</span><span>{formatarMoeda(pedido.subtotal)}</span>
          </div>
          <div className="flex justify-between text-gray-500">
            <span>Frete</span><span>{formatarMoeda(pedido.frete)}</span>
          </div>
          <div className="flex justify-between text-gray-900 font-bold border-t border-gray-100 pt-2 mt-1">
            <span>Total</span><span>{formatarMoeda(pedido.total)}</span>
          </div>
        </div>

        {/* Cliente */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
          <h2 className="text-gray-900 font-bold text-sm mb-3">Dados do Cliente</h2>
          <p className="text-gray-700 text-sm mb-2">{pedido.compradorNome}</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <Phone size={14} className="text-green-500" />
              <span>{formatarTelefone(pedido.compradorTelefone)}</span>
            </div>
            <button
              onClick={copiarTelefone}
              className="text-gray-400 hover:text-green-600 transition-colors flex items-center gap-1 text-xs font-medium"
            >
              {copiado ? <CheckCircle size={14} className="text-green-500" /> : <Copy size={14} />}
              {copiado ? 'Copiado' : 'Copiar'}
            </button>
          </div>
        </div>
      </div>

      {/* Botão de ação sticky */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
        {pedido.statusCliente === 'ENTREGUE' ? (
          <div className="w-full bg-green-50 border border-green-200 text-green-700 font-bold py-4 rounded-2xl flex items-center justify-center gap-2">
            <CheckCircle size={18} /> Entrega concluída
          </div>
        ) : pedido.statusCliente === 'EM_ROTA' && meuPedido ? (
          <button
            onClick={() => setModalAberto(true)}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-colors"
          >
            <CheckCircle size={18} /> Confirmar Entrega
          </button>
        ) : pedido.statusCliente === 'LIBERADO' && !pedido.entregadorId ? (
          <button
            onClick={handleAceitar}
            disabled={aceitando}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            {aceitando
              ? <><Loader2 size={18} className="animate-spin" /> Aceitando...</>
              : <>🛵 Aceitar e Ir para Entrega</>}
          </button>
        ) : null}
      </div>

      {/* Modal confirmação */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm border border-gray-200 shadow-xl">
            <h3 className="text-gray-900 font-bold text-lg mb-2">Confirmar Entrega?</h3>
            <p className="text-gray-500 text-sm mb-6">Você confirma que entregou o pedido ao cliente?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setModalAberto(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmar}
                disabled={confirmando}
                className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                {confirmando ? <Loader2 size={16} className="animate-spin" /> : null}
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
