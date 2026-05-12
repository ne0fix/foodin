'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Tag,
  LayoutList,
  ExternalLink,
  ShoppingBag,
  Users,
} from 'lucide-react';

const navLinks = [
  { href: '/admin/dashboard', label: 'Dashboard',      icon: LayoutDashboard },
  { href: '/admin/pedidos',   label: 'Pedidos',        icon: ShoppingBag },
  { href: '/admin/clientes',  label: 'Clientes',       icon: Users },
  { href: '/admin/produtos',  label: 'Produtos',       icon: Package },
  { href: '/admin/categorias',label: 'Categorias',     icon: Tag },
  { href: '/admin/secoes',    label: 'Seções da Home', icon: LayoutList },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 flex-shrink-0 bg-white border-r border-gray-100 flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center justify-center border-b border-gray-100">
        <Link href="/admin/dashboard">
          <Image src="/foodin.png" alt="foodin" width={100} height={48} style={{ height: 'auto' }} />
        </Link>
      </div>

      {/* Nav label */}
      <div className="px-5 pt-6 pb-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Menu</p>
      </div>

      {/* Links */}
      <nav className="flex-1 px-3 space-y-0.5">
        {navLinks.map((link) => {
          const isActive = pathname.startsWith(link.href);
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-green-50 text-green-700'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
              }`}
            >
              <Icon size={17} className={isActive ? 'text-green-600' : 'text-gray-400'} />
              <span>{link.label}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-green-500" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-gray-100 space-y-0.5">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-all"
        >
          <ExternalLink size={17} className="text-gray-400" />
          <span>Ver site</span>
        </a>
        <div className="px-3 pt-3 mt-1">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-xs font-bold">
              GN
            </div>
            <div className="min-w-0">
              <p className="text-gray-800 text-xs font-semibold truncate">Super G & N</p>
              <p className="text-gray-400 text-[10px]">Pacatuba, CE</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
