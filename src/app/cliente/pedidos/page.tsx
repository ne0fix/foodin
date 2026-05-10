'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Package, ChevronRight, ChevronLeft, Filter } from 'lucide-react';
import { StatusBadge } from '@/src/components/ui/StatusBadge';
import { formatarMoeda } from '@/src/utils/formatadores';

interface PedidoResumo {
  id: string;
  numero: string;
  total: number;
  metodoPagamento: string;
  statusCliente: string;
  criadoEm: string;
  itens: number;
}

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<PedidoResumo[]>([]);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [statusFiltro, setStatusFiltro] = useState('');
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    setCarregando(true);
    const params = new URLSearchParams({
      page: pagina.toString(),
      ...(statusFiltro ? { status: statusFiltro } : {}),
    });

    fetch(`/api/cliente/pedidos?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        setPedidos(data.pedidos || []);
        setTotalPaginas(data.pages || 1);
      })
      .catch(err => console.error(err))
      .finally(() => setCarregando(false));
  }, [pagina, statusFiltro]);

  return (
    <div className="space-y-6">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Meus Pedidos</h1>

        {/* Filtro */}
        <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-xl px-3 py-2.5">
          <Filter size={18} className="text-gray-400" />
          <select
            value={statusFiltro}
            onChange={e => { setStatusFiltro(e.target.value); setPagina(1); }}
            className="text-sm font-bold text-gray-700 outline-none bg-transparent cursor-pointer"
          >
            <option value="">Todos os status</option>
            <option value="PEDIDO_REALIZADO">Pedido Realizado</option>
            <option value="PAGAMENTO_PROCESSANDO">Processando</option>
            <option value="APROVADO">Aprovado</option>
            <option value="EM_SEPARACAO">Em Separação</option>
            <option value="LIBERADO">Liberado</option>
            <option value="CANCELADO">Cancelado</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="divide-y divide-gray-50">
          {carregando ? (
            <div className="py-12 flex justify-center">
              <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : pedidos.length > 0 ? (
            pedidos.map(pedido => (
              <Link key={pedido.id} href={`/cliente/pedidos/${pedido.id}`}
                className="flex items-center gap-3 px-4 sm:px-5 py-4 hover:bg-gray-50/60 transition-colors">
                <div className="w-10 h-10 bg-gray-50 text-gray-400 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Package size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900">Pedido #{pedido.numero}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(pedido.criadoEm).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })} · {pedido.itens} {pedido.itens === 1 ? 'item' : 'itens'}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <p className="text-sm font-black text-gray-900">{formatarMoeda(pedido.total)}</p>
                  <StatusBadge status={pedido.statusCliente} />
                </div>
                <ChevronRight size={16} className="text-gray-300 flex-shrink-0 ml-1" />
              </Link>
            ))
          ) : (
            <div className="py-16 flex flex-col items-center gap-4 text-center px-6">
              <div className="w-16 h-16 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center">
                <Package size={32} />
              </div>
              <div>
                <p className="text-gray-900 font-bold text-lg">Nenhum pedido encontrado.</p>
                <p className="text-gray-500 text-sm">Tente mudar o filtro ou faça sua primeira compra!</p>
              </div>
              <Link href="/" className="inline-block bg-green-600 text-white font-bold px-8 py-3 rounded-xl hover:bg-green-700 transition-colors">
                Ir para as compras
              </Link>
            </div>
          )}
        </div>

        {/* Paginação */}
        {totalPaginas > 1 && (
          <div className="p-4 sm:p-5 bg-gray-50 border-t border-gray-100 flex items-center justify-center gap-4">
            <button
              disabled={pagina === 1 || carregando}
              onClick={() => setPagina(p => p - 1)}
              className="p-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:text-green-600 disabled:opacity-50 transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="text-sm font-bold text-gray-700">
              Página {pagina} de {totalPaginas}
            </span>
            <button
              disabled={pagina === totalPaginas || carregando}
              onClick={() => setPagina(p => p + 1)}
              className="p-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:text-green-600 disabled:opacity-50 transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
