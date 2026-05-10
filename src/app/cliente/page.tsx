'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Package, ChevronRight, User, ShieldCheck, ShoppingBag } from 'lucide-react';
import { StatusBadge } from '@/src/components/ui/StatusBadge';
import { formatarMoeda } from '@/src/utils/formatadores';

interface PedidoResumo {
  id: string;
  numero: string;
  total: number;
  metodoPagamento: string;
  statusCliente: string;
  criadoEm: string;
}

export default function DashboardPage() {
  const [pedidos, setPedidos] = useState<PedidoResumo[]>([]);
  const [totalPedidos, setTotalPedidos] = useState(0);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    fetch('/api/cliente/pedidos?page=1')
      .then(res => res.json())
      .then(data => {
        if (data.pedidos) {
          setPedidos(data.pedidos.slice(0, 3));
          setTotalPedidos(data.total);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setCarregando(false));
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="w-10 h-10 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mb-4">
            <Package size={24} />
          </div>
          <p className="text-sm font-medium text-gray-500">Pedidos Totais</p>
          <p className="text-2xl font-bold text-gray-900">{totalPedidos}</p>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4">
            <ShoppingBag size={24} />
          </div>
          <p className="text-sm font-medium text-gray-500">Último Status</p>
          <div className="mt-1">
            {pedidos.length > 0 ? (
              <StatusBadge status={pedidos[0].statusCliente} />
            ) : (
              <p className="text-lg font-bold text-gray-400">Nenhum pedido</p>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-4">
            <User size={24} />
          </div>
          <p className="text-sm font-medium text-gray-500">Status da Conta</p>
          <p className="text-lg font-bold text-green-600 flex items-center gap-1.5">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Ativa e Segura
          </p>
        </div>
      </div>

      {/* Últimos Pedidos */}
      <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900">Últimos Pedidos</h3>
          <Link href="/cliente/pedidos" className="text-sm font-bold text-green-600 hover:underline flex items-center gap-1">
            Ver todos <ChevronRight size={16} />
          </Link>
        </div>
        
        <div className="divide-y divide-gray-100">
          {carregando ? (
            <div className="p-8 text-center text-gray-400">Carregando seus pedidos...</div>
          ) : pedidos.length > 0 ? (
            pedidos.map(pedido => (
              <Link 
                key={pedido.id} 
                href={`/cliente/pedidos/${pedido.id}`}
                className="flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="space-y-1">
                  <p className="text-sm font-bold text-gray-900">#{pedido.numero}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(pedido.criadoEm).toLocaleDateString('pt-BR')} · {pedido.metodoPagamento}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-bold text-gray-900">{formatarMoeda(pedido.total)}</p>
                  </div>
                  <StatusBadge status={pedido.statusCliente} />
                  <ChevronRight size={20} className="text-gray-300" />
                </div>
              </Link>
            ))
          ) : (
            <div className="p-12 text-center space-y-4">
              <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto">
                <Package size={32} />
              </div>
              <div>
                <p className="text-gray-900 font-bold">Você ainda não fez nenhum pedido.</p>
                <p className="text-sm text-gray-500">Que tal começar a encher o seu carrinho?</p>
              </div>
              <Link href="/" className="inline-block bg-green-600 text-white font-bold px-6 py-2.5 rounded-xl hover:bg-green-700 transition-colors">
                Ir para as compras
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Atalhos Rápidos */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link 
          href="/cliente/perfil"
          className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4 hover:border-green-300 transition-all group"
        >
          <div className="w-12 h-12 bg-gray-50 text-gray-600 rounded-xl flex items-center justify-center group-hover:bg-green-50 group-hover:text-green-600 transition-colors">
            <User size={24} />
          </div>
          <div>
            <p className="font-bold text-gray-900">Editar Perfil</p>
            <p className="text-xs text-gray-500">Nome, WhatsApp e Endereços</p>
          </div>
        </Link>

        <Link 
          href="/cliente/seguranca"
          className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4 hover:border-green-300 transition-all group"
        >
          <div className="w-12 h-12 bg-gray-50 text-gray-600 rounded-xl flex items-center justify-center group-hover:bg-green-50 group-hover:text-green-600 transition-colors">
            <ShieldCheck size={24} />
          </div>
          <div>
            <p className="font-bold text-gray-900">Segurança</p>
            <p className="text-xs text-gray-500">Trocar meu PIN de acesso</p>
          </div>
        </Link>
      </section>

    </div>
  );
}
