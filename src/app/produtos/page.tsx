'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useProdutosViewModel } from '../../viewmodels/produtos.vm';
import ProdutoCard from '../../components/ProdutoCard';
import { mockCategorias } from '../../mocks/produtos.mock';
import { ChevronRight, Filter, X } from 'lucide-react';

export default function ProdutosPage() {
  const { produtos, carregando } = useProdutosViewModel();
  const [showFilters, setShowFilters] = useState(false);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string | null>(null);
  const [ordenacao, setOrdenacao] = useState('padrao');

  const produtosFiltrados = produtos
    .filter(p => !categoriaSelecionada || p.categoria === categoriaSelecionada)
    .sort((a, b) => {
      if (ordenacao === 'menor') return a.preco - b.preco;
      if (ordenacao === 'maior') return b.preco - a.preco;
      if (ordenacao === 'avaliacao') return b.avaliacao - a.avaliacao;
      return 0;
    });

  return (
    <div className="container mx-auto px-4 max-w-7xl py-8">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6 overflow-x-auto whitespace-nowrap">
        <Link href="/" className="hover:text-green-600">Início</Link>
        <ChevronRight size={14} />
        <span className="font-medium text-gray-900">
          {categoriaSelecionada
            ? mockCategorias.find(c => c.id === categoriaSelecionada)?.nome ?? 'Produtos'
            : 'Todos os Produtos'}
        </span>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <aside className={`
          fixed inset-0 z-40 bg-black/40 lg:bg-transparent lg:static lg:inset-auto lg:z-auto
          lg:w-60 lg:flex-shrink-0
          ${showFilters ? 'flex' : 'hidden lg:flex'}
        `} onClick={() => setShowFilters(false)}>
          <div
            className="ml-auto w-72 lg:w-full h-full lg:h-auto bg-white lg:rounded-2xl lg:border lg:border-gray-100 p-6 overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-extrabold text-gray-900">Filtros</h2>
              <button onClick={() => setShowFilters(false)} className="lg:hidden text-gray-400 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>

            {/* Categorias */}
            <div className="mb-6">
              <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wider">Categorias</h3>
              <ul className="space-y-1">
                <li>
                  <button
                    onClick={() => setCategoriaSelecionada(null)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${!categoriaSelecionada ? 'bg-green-50 text-green-700 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    Todas as categorias
                  </button>
                </li>
                {mockCategorias.map(cat => (
                  <li key={cat.id}>
                    <button
                      onClick={() => setCategoriaSelecionada(cat.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${categoriaSelecionada === cat.id ? 'bg-green-50 text-green-700 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                      <span>{cat.icone}</span>
                      {cat.nome}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Preferências */}
            <div>
              <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wider">Preferências</h3>
              <ul className="space-y-3">
                {['Orgânico', 'Sem Glúten', 'Vegano', 'Sem Lactose'].map(pref => (
                  <li key={pref}>
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input type="checkbox" className="w-4 h-4 rounded border-gray-300 accent-green-600" />
                      <span className="text-sm text-gray-600 group-hover:text-gray-900">{pref}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>

        {/* Conteúdo Principal */}
        <main className="flex-1 min-w-0">
          {/* Barra superior */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-gray-50 px-4 py-3 rounded-xl border border-gray-100 mb-5 gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(true)}
                className="lg:hidden flex items-center gap-2 text-sm font-bold text-gray-700 bg-white border border-gray-200 px-4 py-2 rounded-lg"
              >
                <Filter size={16} /> Filtros
              </button>
              <p className="text-sm text-gray-500">
                <span className="font-bold text-gray-900">{produtosFiltrados.length}</span> produtos encontrados
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 hidden sm:inline">Ordenar por:</span>
              <select
                value={ordenacao}
                onChange={e => setOrdenacao(e.target.value)}
                className="bg-white border border-gray-200 rounded-lg text-sm px-3 py-2 outline-none font-medium cursor-pointer"
              >
                <option value="padrao">Mais relevantes</option>
                <option value="menor">Menor preço</option>
                <option value="maior">Maior preço</option>
                <option value="avaliacao">Melhor avaliados</option>
              </select>
            </div>
          </div>

          {/* Grid */}
          {carregando ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-gray-100 rounded-2xl aspect-square animate-pulse" />
              ))}
            </div>
          ) : produtosFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl">
              <span className="text-5xl mb-4">🔍</span>
              <p className="font-bold text-lg">Nenhum produto encontrado</p>
              <p className="text-sm mt-1">Tente outra categoria ou filtro</p>
              <button onClick={() => setCategoriaSelecionada(null)} className="mt-4 text-green-600 hover:underline text-sm font-medium">
                Limpar filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              {produtosFiltrados.map(produto => (
                <ProdutoCard key={produto.id} produto={produto} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
