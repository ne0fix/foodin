'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Produto } from '../models/produto.model';
import { formatarMoeda } from '../utils/formatadores';
import { useCarrinhoViewModel } from '../viewmodels/carrinho.vm';
import { ShoppingCart, Star, ImageOff } from 'lucide-react';

interface Props {
  produto: Produto;
  horizontal?: boolean;
}

function Estrelas({ avaliacao }: { avaliacao: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star
          key={s}
          size={12}
          className={s <= Math.round(avaliacao) ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'}
        />
      ))}
    </div>
  );
}

export default function ProdutoCard({ produto, horizontal = false }: Props) {
  const { adicionarItem } = useCarrinhoViewModel();
  const [imgError, setImgError] = useState(false);

  const handleAddCart = (e: React.MouseEvent) => {
    e.preventDefault();
    adicionarItem(produto, 1);
  };

  const desconto = produto.precoOriginal
    ? Math.round((1 - produto.preco / produto.precoOriginal) * 100)
    : null;

  if (horizontal) {
    return (
      <Link
        href={`/produto/${produto.id}`}
        className="group flex gap-4 items-center bg-white border border-gray-100 rounded-2xl p-4 hover:shadow-md hover:border-green-200 transition-all"
      >
        <div className="relative w-24 h-24 rounded-xl bg-white flex-shrink-0 overflow-hidden border border-gray-100 shadow-sm">
          {imgError ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <ImageOff size={24} className="text-gray-300" />
            </div>
          ) : (
            <Image
              src={produto.imagem}
              alt={produto.nome}
              fill
              sizes="96px"
              className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
              onError={() => setImgError(true)}
            />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-400 truncate">{produto.quantidadePacote}</p>
          <h3 className="font-bold text-gray-800 text-sm line-clamp-2 group-hover:text-green-600 transition-colors mt-0.5 mb-2">
            {produto.nome}
          </h3>
          <div className="flex items-center justify-between">
            <div>
              {produto.precoOriginal && (
                <span className="text-xs text-gray-400 line-through block">{formatarMoeda(produto.precoOriginal)}</span>
              )}
              <span className="text-base font-extrabold text-green-600">{formatarMoeda(produto.preco)}</span>
            </div>
            <button
              onClick={handleAddCart}
              className="w-9 h-9 bg-green-50 hover:bg-green-600 text-green-600 hover:text-white rounded-full flex items-center justify-center transition-colors flex-shrink-0"
              aria-label="Adicionar ao carrinho"
            >
              <ShoppingCart size={16} />
            </button>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/produto/${produto.id}`}
      className="group flex flex-col bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-lg hover:border-green-200 transition-all duration-300 min-h-[340px]"
    >
      {/* Imagem */}
      <div className="w-full px-3 pt-3">
        <div className="relative w-full aspect-square bg-gray-50 rounded-xl border border-gray-100 overflow-hidden shadow-sm">
          {imgError ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <ImageOff size={32} className="text-gray-300" />
            </div>
          ) : (
            <Image
              src={produto.imagem}
              alt={produto.nome}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-contain p-4 group-hover:scale-105 transition-transform duration-500"
              onError={() => setImgError(true)}
            />
          )}
        </div>
      </div>

      {/* Conteúdo */}
      <div className="p-4 flex flex-col flex-1">
        <p className="text-xs text-gray-400 truncate mb-1">{produto.quantidadePacote}</p>
        <h3 className="font-semibold text-gray-800 text-sm line-clamp-2 group-hover:text-green-600 transition-colors leading-snug" style={{ minHeight: '2.5rem' }}>
          {produto.nome}
        </h3>

        <div className="flex items-center gap-2 mt-2 mb-3">
          <Estrelas avaliacao={produto.avaliacao} />
          <span className="text-xs text-gray-400">({produto.numAvaliacoes})</span>
        </div>

        <div className="flex items-center justify-between mt-auto">
          <div className="flex flex-col">
            {produto.precoOriginal && (
              <span className="text-xs text-gray-400 line-through leading-none">{formatarMoeda(produto.precoOriginal)}</span>
            )}
            <span className="text-lg font-extrabold text-green-600 leading-tight">{formatarMoeda(produto.preco)}</span>
          </div>
          <button
            onClick={handleAddCart}
            className="w-10 h-10 bg-green-50 hover:bg-green-600 text-green-600 hover:text-white rounded-full flex items-center justify-center transition-colors shadow-sm"
            aria-label="Adicionar ao carrinho"
          >
            <ShoppingCart size={18} />
          </button>
        </div>
      </div>
    </Link>
  );
}
