'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import ProdutoCard from '@/src/components/ProdutoCard';
import { useCategoriasViewModel } from '@/src/viewmodels/categorias.vm';
import { ProdutoAPI } from '@/src/services/api/produto.api';
import { Produto } from '@/src/models/produto.model';
import { ChevronRight, Filter, X } from 'lucide-react';
import { ProdutoCardSkeleton } from '@/src/components/ui/Skeleton';

function ProdutosContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Categoria vem sempre da URL — fonte de verdade única
  const categoriaSelecionada = searchParams.get('categoria');

  const { categorias } = useCategoriasViewModel();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [ordenacao, setOrdenacao] = useState('padrao');
  const [showFilters, setShowFilters] = useState(false);

  const carregar = useCallback(async (cat: string | null) => {
    setCarregando(true);
    try {
      const data = await ProdutoAPI.listarProdutos(cat ? { categoria: cat } : undefined);
      setProdutos(data);
    } finally {
      setCarregando(false);
    }
  }, []);

  // Recarrega sempre que a URL mudar
  useEffect(() => {
    carregar(categoriaSelecionada);
  }, [categoriaSelecionada, carregar]);

  // Re-busca ao retornar para a aba (captura mudanças de estoque feitas pelo admin)
  useEffect(() => {
    const onFocus = () => carregar(categoriaSelecionada);
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [categoriaSelecionada, carregar]);

  const selecionarCategoria = (id: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (id) params.set('categoria', id);
    else params.delete('categoria');
    router.push(`/produtos?${params.toString()}`);
    setShowFilters(false);
  };

  const produtosFiltrados = [...produtos].sort((a, b) => {
    if (ordenacao === 'menor') return a.preco - b.preco;
    if (ordenacao === 'maior') return b.preco - a.preco;
    if (ordenacao === 'avaliacao') return b.avaliacao - a.avaliacao;
    return 0;
  });

  const nomeCategoria = categorias.find(c => c.id === categoriaSelecionada)?.nome;

  return (
    <div className="container mx-auto px-4 max-w-7xl py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6 overflow-x-auto whitespace-nowrap">
        <Link href="/" className="hover:text-green-600">Início</Link>
        <ChevronRight size={14} />
        {nomeCategoria ? (
          <>
            <Link href="/produtos" className="hover:text-orange-600">Cardápio</Link>
            <ChevronRight size={14} />
            <span className="font-medium text-gray-900">{nomeCategoria}</span>
          </>
        ) : (
          <span className="font-medium text-gray-900">Cardápio</span>
        )}
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <aside
          className={`fixed inset-0 z-40 bg-black/40 lg:bg-transparent lg:static lg:inset-auto lg:z-auto lg:w-60 lg:flex-shrink-0 ${showFilters ? 'flex' : 'hidden lg:flex'}`}
          onClick={() => setShowFilters(false)}
        >
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

            <div className="mb-6">
              <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wider">Categorias</h3>
              <ul className="space-y-1">
                <li>
                  <button
                    onClick={() => selecionarCategoria(null)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${!categoriaSelecionada ? 'bg-orange-50 text-orange-700 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    Todos os pratos
                  </button>
                </li>
                {categorias.map(cat => (
                  <li key={cat.id}>
                    <button
                      onClick={() => selecionarCategoria(cat.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${categoriaSelecionada === cat.id ? 'bg-orange-50 text-orange-700 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                      <span>{cat.icone}</span>
                      {cat.nome}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>

        {/* Conteúdo Principal */}
        <main className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-gray-50 px-4 py-3 rounded-xl border border-gray-100 mb-5 gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(true)}
                className="lg:hidden flex items-center gap-2 text-sm font-bold text-gray-700 bg-white border border-gray-200 px-4 py-2 rounded-lg"
              >
                <Filter size={16} /> Filtros
              </button>
              <p className="text-sm text-gray-500">
                <span className="font-bold text-gray-900">{produtosFiltrados.length}</span> {produtosFiltrados.length === 1 ? 'prato encontrado' : 'pratos encontrados'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 hidden sm:inline">Ordenar por:</span>
              <select
                value={ordenacao}
                onChange={e => setOrdenacao(e.target.value)}
                className="bg-white border border-gray-200 rounded-lg text-sm px-3 py-2 outline-none font-medium cursor-pointer"
              >
                <option value="padrao">Destaques</option>
                <option value="menor">Menor preço</option>
                <option value="maior">Maior preço</option>
                <option value="avaliacao">Mais bem avaliados</option>
              </select>
            </div>
          </div>

          {carregando ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <ProdutoCardSkeleton key={i} />
              ))}
            </div>
          ) : produtosFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl">
              <span className="text-5xl mb-4">🍽️</span>
              <p className="font-bold text-lg">Nenhum prato encontrado nessa categoria</p>
              <p className="text-sm mt-1">Tente outra categoria ou busca</p>
              <button onClick={() => selecionarCategoria(null)} className="mt-4 text-orange-500 hover:underline text-sm font-medium">
                Ver todos os pratos
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

export default function ProdutosPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-32"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" /></div>}>
      <ProdutosContent />
    </Suspense>
  );
}
