'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { LogOut, Bike, ChevronRight, MapPin } from 'lucide-react';
import { useEntregador } from '@/src/hooks/useEntregador';

interface PedidoItem {
  nomeProduto: string;
  quantidade: number;
  preco: number;
  imagemProduto: string;
}

interface Pedido {
  id: string;
  statusCliente: string;
  compradorNome: string;
  compradorTelefone: string;
  logradouro: string | null;
  numero: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  total: number;
  frete: number;
  criadoEm: string;
  items: PedidoItem[];
}

function tempoRelativo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return 'agora';
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`;
  return `há ${Math.floor(diff / 3600)}h`;
}

function formatarMoeda(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function EntregadorPage() {
  const { entregador, loading: loadingAuth } = useEntregador();
  const router = useRouter();
  const [abaAtiva, setAbaAtiva] = useState<'disponíveis' | 'em-rota'>('disponíveis');
  const [disponiveis, setDisponiveis] = useState<Pedido[]>([]);
  const [emRota, setEmRota] = useState<Pedido[]>([]);
  const [carregando, setCarregando] = useState(true);

  const buscarPedidos = useCallback(async () => {
    const [r1, r2] = await Promise.all([
      fetch('/api/entregador/pedidos?status=LIBERADO'),
      fetch('/api/entregador/pedidos?status=EM_ROTA'),
    ]);
    if (r1.ok) setDisponiveis(await r1.json());
    if (r2.ok) setEmRota(await r2.json());
    setCarregando(false);
  }, []);

  useEffect(() => {
    if (!entregador) return;
    buscarPedidos();
    const interval = setInterval(buscarPedidos, 15000);
    return () => clearInterval(interval);
  }, [entregador, buscarPedidos]);

  async function handleLogout() {
    await fetch('/api/entregador/logout', { method: 'POST' });
    router.push('/entregador/login');
  }

  if (loadingAuth || carregando) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const lista = abaAtiva === 'disponíveis' ? disponiveis : emRota;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between px-4 h-14">
          <Image src="/foodin.png" alt="FoodIN" width={80} height={38} className="h-7 w-auto" />
          <span className="text-gray-800 font-bold text-sm truncate mx-3">{entregador?.nome}</span>
          <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 transition-colors p-1">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Abas */}
      <div className="bg-white border-b border-gray-200 sticky top-14 z-10">
        <div className="flex">
          {(['disponíveis', 'em-rota'] as const).map(aba => (
            <button
              key={aba}
              onClick={() => setAbaAtiva(aba)}
              className={`flex-1 py-3 text-sm font-bold transition-colors flex items-center justify-center gap-2 ${
                abaAtiva === aba
                  ? 'text-green-600 border-b-2 border-green-600'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {aba === 'disponíveis' ? 'Disponíveis' : 'Em Rota'}
              {aba === 'disponíveis' && disponiveis.length > 0 && (
                <span className="bg-green-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                  {disponiveis.length}
                </span>
              )}
              {aba === 'em-rota' && emRota.length > 0 && (
                <span className="bg-blue-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                  {emRota.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Conteúdo */}
      <div className="px-4 py-4 space-y-3 pb-24">
        {lista.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Bike size={30} className="text-gray-400" />
            </div>
            <p className="text-gray-600 font-semibold">
              {abaAtiva === 'disponíveis' ? 'Nenhum pedido disponível' : 'Nenhum pedido em andamento'}
            </p>
            <p className="text-gray-400 text-sm mt-1">
              {abaAtiva === 'disponíveis' ? 'Novos pedidos aparecem aqui automaticamente' : 'Aceite um pedido disponível'}
            </p>
          </div>
        ) : (
          lista.map(pedido => (
            <button
              key={pedido.id}
              onClick={() => router.push(`/entregador/pedido/${pedido.id}`)}
              className="w-full bg-white border border-gray-200 rounded-2xl p-4 text-left hover:border-green-500 hover:shadow-sm transition-all active:scale-[0.98] shadow-sm"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-xs text-gray-400 font-mono">#{pedido.id.slice(0, 8)}</p>
                  <p className="text-gray-900 font-bold">{pedido.compradorNome}</p>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-green-600 font-bold">{formatarMoeda(pedido.total)}</span>
                  <ChevronRight size={16} className="text-gray-300" />
                </div>
              </div>
              <div className="flex items-start gap-1.5 text-gray-500 text-sm mb-3">
                <MapPin size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
                <span>
                  {pedido.logradouro}, {pedido.numero} — {pedido.bairro}
                  <br />
                  <span className="text-gray-400 text-xs">{pedido.cidade} - {pedido.uf}</span>
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-400 border-t border-gray-100 pt-2">
                <span>{pedido.items.length} {pedido.items.length === 1 ? 'item' : 'itens'} · frete {formatarMoeda(pedido.frete)}</span>
                <span>{tempoRelativo(pedido.criadoEm)}</span>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
