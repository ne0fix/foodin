'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { LayoutDashboard, Package, User, ShieldCheck, LogOut, Loader2, Menu, X, ChevronRight } from 'lucide-react';

interface Cliente { id: string; nome: string; cpf: string; }

const NAV = [
  { label: 'Início',      href: '/cliente',           icon: LayoutDashboard },
  { label: 'Pedidos',     href: '/cliente/pedidos',   icon: Package },
  { label: 'Meu perfil',  href: '/cliente/perfil',    icon: User },
  { label: 'Segurança',   href: '/cliente/seguranca', icon: ShieldCheck },
];

function Avatar({ nome }: { nome: string }) {
  const iniciais = nome.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-black text-sm flex-shrink-0 shadow-sm">
      {iniciais}
    </div>
  );
}

export default function ClienteLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [menuAberto, setMenuAberto] = useState(false);

  const isLoginPage = pathname === '/cliente/login' || pathname.startsWith('/cliente/login?');

  useEffect(() => {
    if (isLoginPage) { setCarregando(false); return; }
    fetch('/api/cliente/me')
      .then(res => { if (!res.ok) { router.push(`/cliente/login?redirect=${encodeURIComponent(pathname)}`); return null; } return res.json(); })
      .then(data => { if (data) setCliente(data); })
      .catch(() => router.push(`/cliente/login?redirect=${encodeURIComponent(pathname)}`))
      .finally(() => setCarregando(false));
  }, [router, pathname, isLoginPage]);

  const handleLogout = async () => {
    await fetch('/api/cliente/logout', { method: 'POST' });
    router.push('/');
  };

  if (isLoginPage || (!carregando && !cliente)) return <>{children}</>;

  if (carregando) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500 font-medium">Carregando sua conta...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* ─── Sidebar desktop ────────────────────────────────────────────────── */}
      <aside className="hidden lg:flex w-64 flex-shrink-0 flex-col fixed inset-y-0 left-0 bg-white border-r border-gray-100 z-30">

        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-gray-100">
          <Link href="/">
            <Image src="/gn2.png" alt="Ekomart" width={120} height={48} className="h-8 w-auto" />
          </Link>
        </div>

        {/* Perfil resumido */}
        <div className="px-4 pt-5 pb-4">
          <div className="flex items-center gap-3 px-3 py-3 rounded-2xl bg-gray-50 border border-gray-100">
            {cliente && <Avatar nome={cliente.nome} />}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-gray-900 truncate">{cliente?.nome.split(' ')[0]}</p>
              <p className="text-xs text-gray-400">Cliente</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-3 mb-2">Menu</p>
          {NAV.map(item => {
            const Icon = item.icon;
            const ativo = pathname === item.href || (item.href !== '/cliente' && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                  ${ativo ? 'bg-green-600 text-white shadow-sm shadow-green-600/25' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
              >
                <Icon size={17} className={ativo ? 'text-white' : 'text-gray-400'} />
                {item.label}
                {ativo && <ChevronRight size={14} className="ml-auto text-white/60" />}
              </Link>
            );
          })}
        </nav>

        {/* Sair */}
        <div className="px-3 py-4 border-t border-gray-100">
          <button onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors">
            <LogOut size={17} /> Sair da conta
          </button>
          <Link href="/" className="flex items-center gap-3 w-full px-3 py-2 mt-0.5 rounded-xl text-xs text-gray-400 hover:text-gray-600 transition-colors">
            ← Voltar à loja
          </Link>
        </div>
      </aside>

      {/* ─── Wrapper do conteúdo ─────────────────────────────────────────────── */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">

        {/* Top bar desktop */}
        <header className="hidden lg:flex h-16 bg-white border-b border-gray-100 items-center px-8 sticky top-0 z-20">
          <div className="flex-1">
            <h2 className="text-sm text-gray-400 font-medium">
              {NAV.find(n => n.href === pathname || (n.href !== '/cliente' && pathname.startsWith(n.href)))?.label ?? 'Área do cliente'}
            </h2>
          </div>
          {cliente && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">Olá, <strong>{cliente.nome.split(' ')[0]}</strong></span>
              <Avatar nome={cliente.nome} />
            </div>
          )}
        </header>

        {/* Top bar mobile */}
        <header className="lg:hidden bg-white border-b border-gray-100 h-14 flex items-center justify-between px-4 sticky top-0 z-20">
          <Link href="/">
            <Image src="/gn2.png" alt="Ekomart" width={100} height={40} className="h-7 w-auto" />
          </Link>
          <button onClick={() => setMenuAberto(true)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-xl">
            <Menu size={22} />
          </button>
        </header>

        {/* Drawer mobile */}
        {menuAberto && (
          <div className="lg:hidden fixed inset-0 z-50" onClick={() => setMenuAberto(false)}>
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <div className="absolute right-0 top-0 h-full w-72 bg-white shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="h-14 flex items-center justify-between px-5 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  {cliente && <Avatar nome={cliente.nome} />}
                  <div>
                    <p className="text-sm font-bold text-gray-900">{cliente?.nome.split(' ')[0]}</p>
                    <p className="text-xs text-gray-400">Cliente</p>
                  </div>
                </div>
                <button onClick={() => setMenuAberto(false)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg">
                  <X size={20} />
                </button>
              </div>
              <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {NAV.map(item => {
                  const Icon = item.icon;
                  const ativo = pathname === item.href || (item.href !== '/cliente' && pathname.startsWith(item.href));
                  return (
                    <Link key={item.href} href={item.href} onClick={() => setMenuAberto(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors
                        ${ativo ? 'bg-green-600 text-white' : 'text-gray-700 hover:bg-gray-50'}`}
                    >
                      <Icon size={18} /> {item.label}
                    </Link>
                  );
                })}
              </nav>
              <div className="p-4 border-t border-gray-100 space-y-1">
                <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors">
                  <LogOut size={18} /> Sair da conta
                </button>
                <Link href="/" onClick={() => setMenuAberto(false)} className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-xs text-gray-400 hover:bg-gray-50 transition-colors">
                  ← Voltar à loja
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Conteúdo */}
        <main className="flex-1 pb-24 lg:pb-8 overflow-hidden">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 w-full">
            {children}
          </div>
        </main>

        {/* Bottom nav mobile */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-100 z-20 px-2 py-2">
          <div className="flex items-center justify-around">
            {NAV.map(item => {
              const Icon = item.icon;
              const ativo = pathname === item.href || (item.href !== '/cliente' && pathname.startsWith(item.href));
              return (
                <Link key={item.href} href={item.href}
                  className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-colors
                    ${ativo ? 'text-green-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <Icon size={22} />
                  <span className="text-[9px] font-bold uppercase tracking-wide">{item.label.split(' ')[0]}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
