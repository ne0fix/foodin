'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCarrinhoViewModel } from '../viewmodels/carrinho.vm';
import { ShoppingCart, Heart, User, Search, Phone, MapPin, ChevronDown, Menu, X } from 'lucide-react';
import { Categoria } from '../models/produto.model';
import { ProdutoAPI } from '../services/api/produto.api';

export default function Header() {
  const { quantidadeTotal } = useCarrinhoViewModel();
  const [menuAberto, setMenuAberto] = useState(false);
  const [categorias, setCategorias] = useState<Categoria[]>([]);

  useEffect(() => {
    ProdutoAPI.listarCategorias().then(setCategorias).catch(() => {});
  }, []);

  return (
    <header className="w-full bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">

      {/* Top Bar — apenas desktop */}
      <div className="bg-green-700 text-white text-xs py-2 hidden md:block">
        <div className="container mx-auto px-4 max-w-7xl flex justify-between items-center gap-4">
          <p className="font-medium">🚚 Entrega grátis em compras acima de <strong>R$&nbsp;89,00</strong> — aproveite!</p>
          <div className="flex gap-5 items-center flex-shrink-0">
            <span className="flex items-center gap-1 opacity-90"><Phone size={12} /> (85) 98105-8342</span>
            <span className="flex items-center gap-1 opacity-90"><MapPin size={12} /> Pacatuba, CE</span>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="container mx-auto px-2 sm:px-4 max-w-7xl py-2 flex items-center justify-between gap-2 sm:gap-3">

        {/* Hambúrguer — apenas mobile */}
        <button
          onClick={() => setMenuAberto(!menuAberto)}
          className="sm:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors flex-shrink-0"
          aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'}
        >
          {menuAberto ? <X size={22} /> : <Menu size={22} />}
        </button>

        {/* Logo */}
        <Link href="/" className="hidden sm:flex items-center flex-shrink-0 mr-5">
          <Image
            src="/gn2.png"
            alt="Ekomart"
            width={499}
            height={241}
            className="h-12 sm:h-14 md:h-24 w-auto"
            priority
          />
        </Link>

        {/* Search */}
        <div className="flex-1 min-w-0">
          <div className="flex w-full border-2 border-green-500 rounded-xl overflow-hidden focus-within:border-green-600 transition-colors">
            <select className="bg-gray-50 border-r border-gray-200 px-3 py-2.5 text-sm outline-none text-gray-600 font-medium hidden lg:block cursor-pointer">
              <option value="">Todas</option>
              {categorias.map(c => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Buscar..."
              className="flex-1 px-2 py-2 sm:px-3 sm:py-2.5 outline-none text-sm min-w-0"
            />
            <button className="bg-green-600 hover:bg-green-700 transition-colors text-white px-2 sm:px-4 flex items-center gap-1.5 font-medium text-sm flex-shrink-0">
              <Search size={16} />
              <span className="hidden sm:inline">Buscar</span>
            </button>
          </div>
        </div>

        {/* Ações */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <Link href="/" className="hidden sm:flex flex-col items-center gap-0.5 text-gray-600 hover:text-green-600 transition-colors p-2 rounded-lg hover:bg-gray-50">
            <User size={20} />
            <span className="hidden lg:block text-[10px] font-medium">Conta</span>
          </Link>
          <Link href="/" className="hidden sm:flex relative flex-col items-center gap-0.5 text-gray-600 hover:text-green-600 transition-colors p-2 rounded-lg hover:bg-gray-50">
            <Heart size={20} />
            <span className="hidden lg:block text-[10px] font-medium">Favoritos</span>
          </Link>
          <Link href="/carrinho" className="relative flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-2 py-2 sm:px-3 sm:py-2.5 rounded-xl transition-colors">
            <div className="relative">
              <ShoppingCart size={20} />
              {quantidadeTotal > 0 && (
                <span className="absolute -top-2.5 -right-2.5 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold">
                  {quantidadeTotal}
                </span>
              )}
            </div>
            <span className="hidden sm:block text-sm font-bold">Carrinho</span>
          </Link>
        </div>
      </div>

      {/* Navegação desktop — categorias dinâmicas */}
      <nav className="border-t border-gray-100 hidden md:block overflow-x-auto hide-scrollbar">
        <div className="px-4 max-w-7xl mx-auto">
          <ul className="flex items-center gap-0.5 text-sm font-medium text-gray-700 py-1 w-max min-w-full">
            <li className="flex-shrink-0">
              <Link
                href="/produtos"
                className="flex items-center gap-1.5 bg-green-600 text-white px-4 py-2 rounded-lg mr-2 hover:bg-green-700 transition-colors font-bold"
              >
                Categorias <ChevronDown size={14} />
              </Link>
            </li>
            {categorias.map(cat => (
              <li key={cat.id} className="flex-shrink-0">
                <Link
                  href={`/produtos?categoria=${encodeURIComponent(cat.id)}`}
                  className="px-3 py-2 rounded-lg hover:bg-gray-50 hover:text-green-600 transition-colors block"
                >
                  {cat.icone} {cat.nome}
                </Link>
              </li>
            ))}
            <li className="ml-auto flex-shrink-0 pl-4">
              <span className="bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                🔥 Até 40% OFF!
              </span>
            </li>
          </ul>
        </div>
      </nav>

      {/* Menu mobile — categorias dinâmicas */}
      {menuAberto && (
        <div className="sm:hidden border-t border-gray-100 bg-white shadow-lg">
          <div className="container mx-auto px-4 py-3 max-w-7xl">
            <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-2.5 mb-3 text-sm font-bold text-red-600 text-center">
              🔥 Até 40% OFF hoje — aproveite!
            </div>
            <ul className="grid grid-cols-2 gap-1">
              {categorias.map(cat => (
                <li key={cat.id}>
                  <Link
                    href={`/produtos?categoria=${encodeURIComponent(cat.id)}`}
                    onClick={() => setMenuAberto(false)}
                    className="flex items-center gap-2 px-3 py-3 rounded-xl text-gray-700 hover:bg-green-50 hover:text-green-700 font-medium text-sm transition-colors"
                  >
                    <span>{cat.icone}</span> {cat.nome}
                  </Link>
                </li>
              ))}
              <li className="col-span-2">
                <Link
                  href="/produtos"
                  onClick={() => setMenuAberto(false)}
                  className="flex items-center justify-center gap-2 px-3 py-3 rounded-xl bg-green-600 text-white font-bold text-sm transition-colors w-full"
                >
                  🗂 Ver todas as categorias
                </Link>
              </li>
            </ul>
            <div className="flex gap-3 mt-3 pt-3 border-t border-gray-100">
              <Link href="/" onClick={() => setMenuAberto(false)} className="flex items-center gap-2 text-sm text-gray-600 px-3 py-2 rounded-lg hover:bg-gray-50 flex-1 justify-center">
                <User size={18} /> Minha Conta
              </Link>
              <Link href="/" onClick={() => setMenuAberto(false)} className="flex items-center gap-2 text-sm text-gray-600 px-3 py-2 rounded-lg hover:bg-gray-50 flex-1 justify-center">
                <Heart size={18} /> Favoritos
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
