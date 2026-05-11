'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Package, ChevronRight, ShoppingBag, ShieldCheck, TrendingUp } from 'lucide-react';
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

interface ClienteData { nome: string; criadoEm: string; }

export default function DashboardPage() {
  const [pedidos, setPedidos] = useState<PedidoResumo[]>([]);
  const [total, setTotal] = useState(0);
  const [cliente, setCliente] = useState<ClienteData | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/cliente/me').then(r => r.json()),
      fetch('/api/cliente/pedidos?page=1').then(r => r.json()),
    ]).then(([c, p]) => {
      setCliente(c);
      setPedidos(p.pedidos?.slice(0, 4) ?? []);
      setTotal(p.total ?? 0);
    }).finally(() => setCarregando(false));
  }, []);

  const hora = new Date().getHours();
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';
  const primeiroNome = cliente?.nome.split(' ')[0] ?? '';

  return (
    <div className="space-y-6">

      {/* ─── Banner de boas-vindas ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-600 via-green-700 to-emerald-800 p-6 sm:p-8">
        <div className="absolute -right-8 -top-8 w-48 h-48 rounded-full bg-white/5" />
        <div className="absolute -right-4 bottom-0 w-32 h-32 rounded-full bg-white/5" />
        <div className="relative">
          <p className="text-green-200 text-sm font-medium">{saudacao}{primeiroNome ? ',' : '!'}</p>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-0.5">
            {primeiroNome || 'Olá!'} 👋
          </h1>
          <p className="text-green-200 mt-2 text-sm">
            {total > 0 ? `Você tem ${total} pedido${total !== 1 ? 's' : ''} no histórico` : 'Sua conta está pronta para as compras'}
          </p>
          <Link href="/produtos"
            className="inline-flex items-center gap-2 mt-4 bg-white text-green-700 font-bold px-4 py-2.5 rounded-xl text-sm hover:bg-green-50 transition-colors shadow-sm">
            <ShoppingBag size={16} /> Ir às compras
          </Link>
        </div>
      </div>

      {/* ─── KPIs ── */}
      <div className="grid grid-cols-2 gap-3">
        {/* Total de pedidos */}
        <div className="bg-white rounded-2xl border border-gray-100 px-4 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
            <Package size={18} className="text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-400 font-medium">Total de pedidos</p>
            <p className="text-2xl font-black text-gray-900 mt-1 text-center">
              {carregando ? '—' : String(total)}
            </p>
          </div>
        </div>

        {/* Último status */}
        <div className="bg-white rounded-2xl border border-gray-100 px-4 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
            <TrendingUp size={18} className="text-purple-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-gray-400 font-medium">Último status</p>
            {!carregando && pedidos[0]?.statusCliente ? (
              <div className="mt-1"><StatusBadge status={pedidos[0].statusCliente} /></div>
            ) : (
              <p className="text-lg font-black text-gray-900 mt-0.5">—</p>
            )}
          </div>
        </div>
      </div>

      {/* ─── Pedidos recentes ── */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-gray-50">
          <h3 className="font-bold text-gray-900">Pedidos recentes</h3>
          <Link href="/cliente/pedidos" className="text-xs font-bold text-green-600 hover:underline flex items-center gap-1">
            Ver todos <ChevronRight size={14} />
          </Link>
        </div>

        {carregando ? (
          <div className="p-10 flex justify-center">
            <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : pedidos.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {pedidos.map(p => (
              <Link key={p.id} href={`/cliente/pedidos/${p.id}`}
                className="flex items-center gap-4 px-5 sm:px-6 py-4 hover:bg-gray-50/60 transition-colors group">
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 group-hover:bg-green-50 transition-colors">
                  <Package size={18} className="text-gray-400 group-hover:text-green-600 transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900">Pedido #{p.numero}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(p.criadoEm).toLocaleDateString('pt-BR')} · {p.itens} {p.itens === 1 ? 'item' : 'itens'}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-black text-gray-900">{formatarMoeda(p.total)}</p>
                  </div>
                  <StatusBadge status={p.statusCliente} />
                  <ChevronRight size={16} className="text-gray-300" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-16 flex flex-col items-center gap-4 text-center px-6">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center">
              <ShoppingBag size={28} className="text-gray-300" />
            </div>
            <div>
              <p className="font-bold text-gray-800">Nenhum pedido ainda</p>
              <p className="text-sm text-gray-400 mt-0.5">Explore nossa loja e faça sua primeira compra</p>
            </div>
            <Link href="/produtos" className="bg-green-600 text-white font-bold px-6 py-2.5 rounded-xl text-sm hover:bg-green-700 transition-colors">
              Explorar produtos
            </Link>
          </div>
        )}
      </div>

      {/* ─── Atalhos ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[
          { href: '/cliente/perfil', icon: Package, label: 'Meus endereços', desc: 'Gerencie seus endereços de entrega', color: 'bg-blue-50 text-blue-600' },
          { href: '/cliente/seguranca', icon: ShieldCheck, label: 'Alterar PIN', desc: 'Mantenha sua conta protegida', color: 'bg-purple-50 text-purple-600' },
        ].map(({ href, icon: Icon, label, desc, color }) => (
          <Link key={href} href={href}
            className="bg-white border border-gray-100 rounded-2xl p-5 flex items-center gap-4 hover:border-gray-200 hover:shadow-sm transition-all group">
            <div className={`w-11 h-11 rounded-xl ${color} flex items-center justify-center flex-shrink-0`}>
              <Icon size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-gray-900 text-sm">{label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
            </div>
            <ChevronRight size={16} className="text-gray-300 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        ))}
      </div>

    </div>
  );
}
