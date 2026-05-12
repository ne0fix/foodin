'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Produto } from '../models/produto.model';
import { formatarMoeda } from '../utils/formatadores';
import { useCarrinhoViewModel } from '../viewmodels/carrinho.vm';
import { Clock, Plus, Star, ImageOff } from 'lucide-react';

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
          size={10}
          className={s <= Math.round(avaliacao) ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'}
        />
      ))}
    </div>
  );
}

function getTempoEntrega(produto: Produto): string {
  if (produto.tempoEntrega) return produto.tempoEntrega;
  if (/\d+\s*[-–]\s*\d+\s*min/i.test(produto.quantidadePacote)) return produto.quantidadePacote;
  return process.env.NEXT_PUBLIC_TEMPO_ENTREGA_PADRAO ?? '30-45 min';
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

  const tempoEntrega = getTempoEntrega(produto);

  if (horizontal) {
    return (
      <Link
        href={`/produto/${produto.id}`}
        className="group flex gap-3 items-center bg-white border border-gray-100 rounded-2xl p-3 hover:shadow-md hover:border-orange-200 transition-all"
      >
        <div className="relative w-20 h-20 rounded-xl bg-gray-100 flex-shrink-0 overflow-hidden">
          {imgError ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <ImageOff size={20} className="text-gray-300" />
            </div>
          ) : (
            <Image
              src={produto.imagem}
              alt={produto.nome}
              fill
              sizes="80px"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              onError={() => setImgError(true)}
            />
          )}
          {!produto.emEstoque && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="text-white text-[9px] font-bold">Indisp.</span>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
            {produto.categoria}
          </span>
          <h3 className="font-bold text-gray-800 text-sm line-clamp-2 group-hover:text-orange-600 transition-colors mt-1 leading-snug">
            {produto.nome}
          </h3>
          <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-0.5">
            <Clock size={10} className="flex-shrink-0" />
            <span>{tempoEntrega}</span>
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <div>
              {produto.precoOriginal && (
                <span className="text-[10px] text-gray-400 line-through block leading-none">
                  {formatarMoeda(produto.precoOriginal)}
                </span>
              )}
              <span className={`text-sm font-extrabold leading-tight ${produto.emEstoque ? 'text-orange-600' : 'text-gray-400'}`}>
                {formatarMoeda(produto.preco)}
              </span>
            </div>
            {produto.emEstoque ? (
              <button
                onClick={handleAddCart}
                className="w-8 h-8 bg-orange-500 hover:bg-orange-600 text-white rounded-full flex items-center justify-center transition-colors flex-shrink-0 shadow-sm"
                aria-label="Adicionar ao pedido"
              >
                <Plus size={16} />
              </button>
            ) : (
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Plus size={16} className="text-gray-300" />
              </div>
            )}
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/produto/${produto.id}`}
      className="group flex flex-col bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-lg hover:border-orange-200 transition-all duration-300"
    >
      {/* Imagem */}
      <div className="relative w-full aspect-[4/3] overflow-hidden bg-gray-100">
        {imgError ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <ImageOff size={32} className="text-gray-300" />
          </div>
        ) : (
          <Image
            src={produto.imagem}
            alt={produto.nome}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={`object-cover transition-transform duration-500 ${produto.emEstoque ? 'group-hover:scale-105' : 'opacity-50'}`}
            onError={() => setImgError(true)}
          />
        )}
        {!produto.emEstoque && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <span className="bg-white text-gray-700 text-xs font-bold px-3 py-1.5 rounded-full">
              Indisponível
            </span>
          </div>
        )}
        {desconto && produto.emEstoque && (
          <div className="absolute top-2 left-2 bg-orange-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow">
            -{desconto}%
          </div>
        )}
      </div>

      {/* Conteúdo */}
      <div className="p-3 flex flex-col flex-1 gap-1.5">
        {/* Categoria + estrelas */}
        <div className="flex items-center justify-between gap-1">
          <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full truncate max-w-[68%]">
            {produto.categoria}
          </span>
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <Estrelas avaliacao={produto.avaliacao} />
            {produto.numAvaliacoes > 0 && (
              <span className="text-[10px] text-gray-400 font-medium ml-0.5">
                ({produto.numAvaliacoes})
              </span>
            )}
          </div>
        </div>

        {/* Nome */}
        <h3
          className="font-bold text-gray-900 text-sm line-clamp-2 group-hover:text-orange-600 transition-colors leading-snug"
          style={{ minHeight: '2.5rem' }}
        >
          {produto.nome}
        </h3>

        {/* Descrição */}
        {produto.descricao && (
          <p className="text-xs text-gray-400 line-clamp-2 leading-snug">
            {produto.descricao}
          </p>
        )}

        {/* Tempo de entrega */}
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Clock size={11} className="text-gray-400 flex-shrink-0" />
          <span>{tempoEntrega}</span>
        </div>

        {/* Preço + botão */}
        <div className="flex items-center justify-between mt-auto pt-1.5 border-t border-gray-50">
          <div className="flex flex-col">
            {produto.precoOriginal && (
              <span className="text-[10px] text-gray-400 line-through leading-none">
                {formatarMoeda(produto.precoOriginal)}
              </span>
            )}
            <span className={`text-base font-extrabold leading-tight ${produto.emEstoque ? 'text-orange-600' : 'text-gray-400'}`}>
              {formatarMoeda(produto.preco)}
            </span>
          </div>
          {produto.emEstoque ? (
            <button
              onClick={handleAddCart}
              className="w-9 h-9 bg-orange-500 hover:bg-orange-600 text-white rounded-full flex items-center justify-center transition-colors shadow-md shadow-orange-500/25 flex-shrink-0"
              aria-label="Adicionar ao pedido"
            >
              <Plus size={18} />
            </button>
          ) : (
            <div
              className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0"
              title="Indisponível"
            >
              <Plus size={18} className="text-gray-300" />
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
