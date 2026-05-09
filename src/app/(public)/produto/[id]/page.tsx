'use client';

import { use, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useProdutoDetailViewModel, useProdutosRelacionados } from '@/src/viewmodels/produtos.vm';
import { useCarrinhoViewModel } from '@/src/viewmodels/carrinho.vm';
import ProdutoCard from '@/src/components/ProdutoCard';
import { formatarMoeda } from '@/src/utils/formatadores';
import { ChevronRight, Heart, Minus, Plus, Share2, Star, ShoppingCart } from 'lucide-react';
import { ProdutoDetailSkeleton } from '@/src/components/ui/Skeleton';

export default function ProdutoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { produto, carregando, quantidadeSelecionada, incrementarQuantidade, decrementarQuantidade } = useProdutoDetailViewModel(resolvedParams.id);
  const { produtos } = useProdutosRelacionados(produto?.categoriaId, produto?.id);
  const { adicionarItem } = useCarrinhoViewModel();
  const [activeTab, setActiveTab] = useState('descricao');
  const [imagemAtiva, setImagemAtiva] = useState(0);

  if (carregando) return <ProdutoDetailSkeleton />;
  if (!produto) return (
    <div className="container mx-auto px-4 py-16 text-center font-bold text-xl text-gray-800">
      Produto não encontrado
    </div>
  );

  return (
    <div className="container mx-auto px-4 max-w-7xl py-5 sm:py-8">

      {/* Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-500 mb-5 overflow-x-auto whitespace-nowrap hide-scrollbar">
        <Link href="/" className="hover:text-green-600">Início</Link>
        <ChevronRight size={12} />
        <Link href="/produtos" className="hover:text-green-600">Produtos</Link>
        <ChevronRight size={12} />
        <span className="font-medium text-gray-900 truncate max-w-[140px] sm:max-w-none">{produto.nome}</span>
      </div>

      {/* Grid principal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12 mb-10 lg:mb-16">

        {/* Imagens */}
        <div className="flex flex-col gap-3">
          {/* Imagem principal */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <Image
              src={[produto.imagem, ...(produto.imagens ?? [])][imagemAtiva] ?? produto.imagem}
              alt={produto.nome}
              width={600}
              height={600}
              className="w-full aspect-square object-contain p-6 sm:p-10 transition-opacity duration-200"
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>

          {/* Miniaturas — só aparece se houver imagens adicionais */}
          {(produto.imagens ?? []).length > 0 && (
            <div className={`grid gap-2 sm:gap-3 grid-cols-${Math.min((produto.imagens ?? []).length + 1, 5)}`}>
              {[produto.imagem, ...(produto.imagens ?? [])].map((src, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setImagemAtiva(i)}
                  className={`rounded-xl border-2 overflow-hidden bg-white transition-all ${imagemAtiva === i ? 'border-green-500 shadow-md' : 'border-gray-200 hover:border-green-300'}`}
                >
                  <Image
                    src={src}
                    alt={`Imagem ${i + 1}`}
                    width={100}
                    height={100}
                    className="w-full aspect-square object-contain p-2"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Informações */}
        <div className="flex flex-col">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 mb-3 leading-tight">
            {produto.nome}
          </h1>

          {/* Avaliação */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map(star => (
                <Star key={star} size={16} className={star <= Math.round(produto.avaliacao) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} />
              ))}
            </div>
            <span className="text-sm font-bold text-gray-700">{produto.avaliacao}</span>
            <span className="text-sm text-gray-400">({produto.numAvaliacoes} avaliações)</span>
          </div>

          {/* Preço */}
          <div className="flex items-baseline gap-3 mb-4">
            <span className="text-3xl sm:text-4xl font-extrabold text-green-600 tracking-tight">
              {formatarMoeda(produto.preco)}
            </span>
            {produto.precoOriginal && (
              <span className="text-lg text-gray-400 line-through">{formatarMoeda(produto.precoOriginal)}</span>
            )}
          </div>

          {/* Estoque */}
          <div className="flex items-center gap-2 mb-5">
            <div className={`w-2.5 h-2.5 rounded-full ${produto.emEstoque ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm font-semibold text-gray-700">
              {produto.emEstoque ? 'Em estoque' : 'Esgotado'}
            </span>
          </div>

          <p className="text-gray-600 text-sm sm:text-base mb-6 leading-relaxed">{produto.descricao}</p>

          {/* Quantidade + Carrinho */}
          <div className="flex flex-row gap-3 mb-6">
            {produto.emEstoque && (
              <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden h-14 w-32 flex-shrink-0 bg-white">
                <button onClick={decrementarQuantidade} className="w-10 h-full flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-green-600 transition-colors">
                  <Minus size={16} />
                </button>
                <span className="flex-1 text-center font-bold text-gray-800">{quantidadeSelecionada}</span>
                <button onClick={incrementarQuantidade} className="w-10 h-full flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-green-600 transition-colors">
                  <Plus size={16} />
                </button>
              </div>
            )}
            {produto.emEstoque ? (
              <button
                onClick={() => adicionarItem(produto, quantidadeSelecionada)}
                className="flex-1 h-14 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white rounded-xl font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-green-600/25 transition-all px-4"
              >
                <ShoppingCart size={20} />
                <span className="hidden sm:inline">Adicionar ao Carrinho</span>
                <span className="sm:hidden">Adicionar</span>
              </button>
            ) : (
              <div className="flex-1 h-14 bg-gray-100 border border-gray-200 text-gray-400 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 cursor-not-allowed select-none">
                <span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
                Produto Esgotado
              </div>
            )}
            <button className="hidden sm:flex w-12 h-14 rounded-xl border border-gray-200 items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 hover:border-red-200 transition-colors flex-shrink-0">
              <Heart size={20} />
            </button>
          </div>

          {/* Detalhes */}
          <div className="border-t border-gray-100 pt-5 space-y-2 text-sm text-gray-600">
            <div className="flex gap-3">
              <span className="font-semibold text-gray-700 w-24 flex-shrink-0">Categoria:</span>
              <span className="capitalize">{produto.categoria.replace(/-/g, ' ')}</span>
            </div>
            <div className="flex gap-3">
              <span className="font-semibold text-gray-700 w-24 flex-shrink-0">Quantidade:</span>
              <span>{produto.quantidadePacote}</span>
            </div>
            {produto.tags.length > 0 && (
              <div className="flex gap-3 items-start">
                <span className="font-semibold text-gray-700 w-24 flex-shrink-0">Tags:</span>
                <div className="flex flex-wrap gap-1.5">
                  {produto.tags.map(t => (
                    <span key={t} className="bg-gray-100 px-2 py-0.5 rounded-md text-xs font-semibold text-gray-500 uppercase">{t}</span>
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-3 items-center pt-1">
              <span className="font-semibold text-gray-700 w-24 flex-shrink-0">Compartilhar:</span>
              <button className="text-gray-400 hover:text-green-600 transition-colors"><Share2 size={16} /></button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-10 lg:mb-16">
        <div className="flex border-b border-gray-200 overflow-x-auto hide-scrollbar gap-4 sm:gap-8">
          {[
            { key: 'descricao',   label: 'Descrição' },
            { key: 'nutritional', label: 'Nutricional' },
            { key: 'reviews',     label: `Avaliações (${produto.numAvaliacoes})` },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`pb-3 font-bold text-sm sm:text-base whitespace-nowrap transition-colors relative flex-shrink-0 ${activeTab === tab.key ? 'text-green-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {tab.label}
              {activeTab === tab.key && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-green-600 rounded-t-full" />
              )}
            </button>
          ))}
        </div>

        <div className="py-6 text-gray-600 text-sm sm:text-base leading-relaxed max-w-3xl">
          {activeTab === 'descricao' && (
            <div className="space-y-3">
              <p>Este produto é selecionado com os mais altos padrões de qualidade. Garantimos frescor e sabor inigualáveis para você e sua família.</p>
              <p>Nossos fornecedores são certificados e praticam produção responsável, entregando os melhores produtos diretamente na sua mesa.</p>
              <ul className="list-disc pl-5 space-y-1.5 mt-3">
                <li>Produto fresco e de qualidade superior</li>
                <li>Rico em nutrientes e vitaminas essenciais</li>
                <li>Embalagem sustentável e ecologicamente responsável</li>
              </ul>
            </div>
          )}
          {activeTab === 'nutritional' && (
            <div className="grid grid-cols-2 gap-3 max-w-xs">
              {[['Calorias', '45 kcal'], ['Carboidratos', '9g'], ['Açúcar', '6g'], ['Fibra', '3g'], ['Proteína', '1g']].map(([k, v]) => (
                <div key={k} className="contents">
                  <div className="font-semibold text-gray-700">{k}:</div>
                  <div>{v}</div>
                </div>
              ))}
            </div>
          )}
          {activeTab === 'reviews' && (
            <div className="space-y-5">
              <div className="border-b border-gray-100 pb-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-bold text-gray-900">João Silva</span>
                  <span className="text-xs text-gray-400">— 2 dias atrás</span>
                </div>
                <div className="flex text-yellow-400 mb-2">
                  {[1,2,3,4,5].map(i => <Star key={i} size={14} className="fill-current" />)}
                </div>
                <p>Qualidade excepcional! Os produtos chegaram muito frescos e bem embalados. Comprarei novamente.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Produtos Relacionados */}
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 mb-5">Produtos Relacionados</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          {produtos.map(p => (
            <ProdutoCard key={p.id} produto={p} />
          ))}
        </div>
      </div>
    </div>
  );
}
