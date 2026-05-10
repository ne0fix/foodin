'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  Package, 
  User, 
  ShieldCheck, 
  LogOut, 
  Loader2,
  Menu,
  X
} from 'lucide-react';

interface Cliente {
  id: string;
  nome: string;
  cpf: string;
}

export default function ClienteLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [menuAberto, setMenuAberto] = useState(false);

  useEffect(() => {
    fetch('/api/cliente/me')
      .then(res => {
        if (!res.ok) {
          router.push(`/cliente/login?redirect=${pathname}`);
          return null;
        }
        return res.json();
      })
      .then(data => {
        if (data) setCliente(data);
      })
      .catch(() => {
        router.push(`/cliente/login?redirect=${pathname}`);
      })
      .finally(() => setCarregando(false));
  }, [router, pathname]);

  const handleLogout = async () => {
    await fetch('/api/cliente/logout', { method: 'POST' });
    router.push('/');
  };

  if (carregando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-green-600" size={40} />
      </div>
    );
  }

  if (!cliente) return null;

  const NAV_ITEMS = [
    { label: 'Dashboard', href: '/cliente', icon: LayoutDashboard },
    { label: 'Meus Pedidos', href: '/cliente/pedidos', icon: Package },
    { label: 'Meu Perfil', href: '/cliente/perfil', icon: User },
    { label: 'Segurança', href: '/cliente/seguranca', icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 sticky top-0 h-screen">
        <div className="p-6">
          <Link href="/">
            <Image src="/gn2.png" alt="Ekomart" width={150} height={60} className="h-10 w-auto" />
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const ativo = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-colors
                  ${ativo ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-green-50 hover:text-green-600'}`}
              >
                <Icon size={20} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut size={20} />
            Sair da conta
          </button>
        </div>
      </aside>

      {/* Header Mobile */}
      <header className="md:hidden bg-white border-b border-gray-200 sticky top-0 z-40 px-4 py-3 flex items-center justify-between">
        <Link href="/">
          <Image src="/gn2.png" alt="Ekomart" width={120} height={50} className="h-8 w-auto" />
        </Link>
        <button 
          onClick={() => setMenuAberto(!menuAberto)}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          {menuAberto ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Menu Mobile Overlay */}
      {menuAberto && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setMenuAberto(false)}>
          <div className="absolute right-0 top-0 h-full w-64 bg-white shadow-xl p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-8">
              <span className="font-bold text-gray-900">Menu</span>
              <button onClick={() => setMenuAberto(false)}><X size={24} /></button>
            </div>
            <nav className="space-y-2">
              {NAV_ITEMS.map(item => {
                const Icon = item.icon;
                const ativo = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuAberto(false)}
                    className={`flex items-center gap-3 px-4 py-4 rounded-xl text-base font-bold transition-colors
                      ${ativo ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-green-50'}`}
                  >
                    <Icon size={22} />
                    {item.label}
                  </Link>
                );
              })}
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-4 py-4 rounded-xl text-base font-bold text-red-600 hover:bg-red-50 transition-colors mt-4 border-t border-gray-100 pt-6"
              >
                <LogOut size={22} />
                Sair da conta
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1">
        
        {/* Top bar (Desktop) */}
        <header className="hidden md:flex bg-white border-b border-gray-200 px-8 py-4 items-center justify-between sticky top-0 z-30">
          <div>
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Área do Cliente</h2>
            <p className="text-lg font-bold text-gray-900">Olá, {cliente.nome.split(' ')[0]}! 👋</p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/cliente/perfil" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 hover:border-green-300 transition-colors">
              <User size={18} />
              <span className="text-sm font-bold">Minha Conta</span>
            </Link>
          </div>
        </header>

        <div className="p-4 md:p-8 max-w-5xl mx-auto">
          {children}
        </div>
      </main>

      {/* Bottom Nav Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 flex items-center justify-between z-40">
        {NAV_ITEMS.map(item => {
          const Icon = item.icon;
          const ativo = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 ${ativo ? 'text-green-600' : 'text-gray-400'}`}
            >
              <Icon size={24} />
              <span className="text-[10px] font-bold uppercase">{item.label.split(' ')[0]}</span>
            </Link>
          );
        })}
      </nav>
      <div className="md:hidden h-20" /> {/* Spacer for bottom nav */}
    </div>
  );
}
