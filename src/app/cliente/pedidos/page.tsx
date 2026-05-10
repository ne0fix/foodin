'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Package, ChevronRight, ChevronLeft, Search, Filter } from 'lucide-react';
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
    <div className="space-y-6 animate-in fade-in duration-500">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Meus Pedidos</h1>
        
        {/* Filtro */}
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2">
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

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="divide-y divide-gray-100">
          {carregando ? (
            <div className="p-12 text-center text-gray-400">Carregando seus pedidos...</div>
          ) : pedidos.length > 0 ? (
            pedidos.map(pedido => (
              <Link 
                key={pedido.id} 
                href={`/cliente/pedidos/${pedido.id}`}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-6 hover:bg-gray-50 transition-colors gap-4"
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-50 text-gray-400 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Package size={20} className="sm:w-6 sm:h-6" />
                  </div>
                  <div className="space-y-0.5 sm:space-y-1">
                    <p className="text-sm sm:text-base font-bold text-gray-900">Pedido #{pedido.numero}</p>
                    <p className="text-xs sm:text-sm text-gray-500">
                      {new Date(pedido.criadoEm).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                    <p className="text-[10px] sm:text-xs text-gray-400">
                      {pedido.itens} {pedido.itens === 1 ? 'item' : 'itens'} · {pedido.metodoPagamento}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 border-t border-gray-100 sm:border-t-0 pt-3 sm:pt-0 mt-1 sm:mt-0">
                  <div className="text-left sm:text-right">
                    <p className="text-[10px] sm:text-xs text-gray-400 uppercase font-bold tracking-wider">Total</p>
                    <p className="text-base sm:text-lg font-black text-green-600">{formatarMoeda(pedido.total)}</p>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <StatusBadge status={pedido.statusCliente} />
                    <ChevronRight size={18} className="text-gray-300 hidden sm:block" />
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="p-20 text-center space-y-4">
              <div className="w-20 h-20 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mx-auto">
                <Search size={40} />
              </div>
              <div>
                <p className="text-gray-900 font-bold text-lg">Nenhum pedido encontrado.</p>
                <p className="text-gray-500">Tente mudar o filtro ou faça sua primeira compra!</p>
              </div>
              <Link href="/" className="inline-block bg-green-600 text-white font-bold px-8 py-3 rounded-xl hover:bg-green-700 transition-colors shadow-lg">
                Ir para as compras
              </Link>
            </div>
          )}
        </div>

        {/* Paginação */}
        {totalPaginas > 1 && (
          <div className="p-6 bg-gray-50 border-t border-gray-100 flex items-center justify-center gap-4">
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
