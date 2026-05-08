'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCarrinhoViewModel } from '@/src/viewmodels/carrinho.vm';
import { formatarMoeda } from '@/src/utils/formatadores';
import { ChevronRight, Minus, Plus, Trash2, ShieldCheck, ShoppingCart } from 'lucide-react';

export default function CarrinhoPage() {
  const { itens, total, subtotal, frete, impostos, atualizarQuantidade, removerItem, limparCarrinho, quantidadeTotal } = useCarrinhoViewModel();

  if (itens.length === 0) {
    return (
      <div className="container mx-auto px-4 max-w-7xl py-16 flex flex-col items-center justify-center text-center">
        <div className="w-32 h-32 sm:w-40 sm:h-40 bg-gray-50 rounded-full flex items-center justify-center mb-6 border-4 border-dashed border-gray-200">
          <ShoppingCart size={48} className="text-gray-300" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-3">Carrinho vazio</h1>
        <p className="text-gray-500 mb-8 max-w-sm text-sm sm:text-base">
          Você ainda não adicionou nenhum produto. Explore nossas ofertas!
        </p>
        <Link
          href="/produtos"
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 px-8 rounded-full transition-colors shadow-md shadow-green-600/25"
        >
          Começar a Comprar
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 max-w-7xl py-5 sm:py-8">

      {/* Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-500 mb-5">
        <Link href="/" className="hover:text-green-600">Início</Link>
        <ChevronRight size={12} />
        <span className="font-medium text-gray-900">Meu Carrinho</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">

        {/* Itens do Carrinho */}
        <div className="w-full lg:flex-1">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

            {/* Header */}
            <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg sm:text-xl font-extrabold text-gray-900">
                Carrinho&nbsp;
                <span className="text-gray-400 font-medium text-base">({quantidadeTotal} {quantidadeTotal === 1 ? 'item' : 'itens'})</span>
              </h2>
              <button
                onClick={limparCarrinho}
                className="text-xs sm:text-sm font-bold text-red-500 hover:text-red-700 flex items-center gap-1 transition-colors"
              >
                <Trash2 size={14} /> Esvaziar
              </button>
            </div>

            {/* Cabeçalho tabela — só desktop */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-50 bg-gray-50/50">
              <div className="col-span-6">Produto</div>
              <div className="col-span-3 text-center">Quantidade</div>
              <div className="col-span-3 text-right">Total</div>
            </div>

            {/* Lista de itens */}
            <div className="divide-y divide-gray-100">
              {itens.map(item => (
                <div key={item.produto.id} className="px-4 sm:px-6 py-4">

                  {/* Mobile: layout vertical compacto | Desktop: grid 12 cols */}
                  <div className="flex gap-3 md:grid md:grid-cols-12 md:gap-4 md:items-center">

                    {/* Imagem + Info */}
                    <div className="flex gap-3 items-center md:col-span-6 min-w-0">
                      <Link
                        href={`/produto/${item.produto.id}`}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-white border border-gray-100 overflow-hidden flex-shrink-0 shadow-sm"
                      >
                        <Image
                          src={item.produto.imagem}
                          alt={item.produto.nome}
                          width={80}
                          height={80}
                          className="w-full aspect-square object-contain p-1.5"
                        />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/produto/${item.produto.id}`}
                          className="font-bold text-gray-900 hover:text-green-600 transition-colors text-sm line-clamp-2"
                        >
                          {item.produto.nome}
                        </Link>
                        <p className="text-xs text-gray-400 mt-0.5">{item.produto.quantidadePacote}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{formatarMoeda(item.produto.preco)}/un</p>
                        {/* Total visível só no mobile */}
                        <p className="text-green-600 font-extrabold text-sm mt-1 md:hidden">
                          {formatarMoeda(item.produto.preco * item.quantidade)}
                        </p>
                      </div>
                    </div>

                    {/* Quantidade */}
                    <div className="flex items-center justify-between md:col-span-3 md:justify-center mt-2 md:mt-0">
                      <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden h-9 bg-white shadow-sm">
                        <button
                          onClick={() => atualizarQuantidade(item.produto.id, item.quantidade - 1)}
                          className="w-9 h-full flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-red-500 transition-colors"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-8 text-center font-bold text-gray-900 text-sm">{item.quantidade}</span>
                        <button
                          onClick={() => atualizarQuantidade(item.produto.id, item.quantidade + 1)}
                          className="w-9 h-full flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-green-600 transition-colors"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      {/* Remover — visível no mobile */}
                      <button
                        onClick={() => removerItem(item.produto.id)}
                        className="md:hidden p-2 text-gray-400 hover:text-red-500 transition-colors"
                        aria-label="Remover"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {/* Total — só desktop */}
                    <div className="hidden md:flex md:col-span-3 items-center justify-end gap-3">
                      <span className="text-base font-extrabold text-gray-900">
                        {formatarMoeda(item.produto.preco * item.quantidade)}
                      </span>
                      <button
                        onClick={() => removerItem(item.produto.id)}
                        className="p-1.5 text-gray-300 hover:text-red-500 transition-colors"
                        aria-label="Remover"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Link continuar comprando */}
          <Link href="/produtos" className="flex items-center gap-1.5 text-sm text-green-600 hover:underline font-medium mt-4">
            <ChevronRight size={14} className="rotate-180" /> Continuar comprando
          </Link>
        </div>

        {/* Resumo do Pedido */}
        <div className="w-full lg:w-80 xl:w-96 flex-shrink-0">
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 sm:p-6 lg:sticky lg:top-24 shadow-sm">
            <h3 className="text-lg font-extrabold text-gray-900 mb-5">Resumo do Pedido</h3>

            <div className="space-y-3 mb-5 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span className="font-bold text-gray-900">{formatarMoeda(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Frete</span>
                <span className="font-bold">
                  {frete === 0
                    ? <span className="text-green-600">Grátis</span>
                    : <span className="text-gray-900">{formatarMoeda(frete)}</span>
                  }
                </span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Impostos est.</span>
                <span className="font-bold text-gray-900">{formatarMoeda(impostos)}</span>
              </div>
            </div>

            <div className="border-t border-dashed border-gray-300 my-4" />

            {/* Cupom */}
            <div className="mb-5">
              <label className="text-xs font-bold text-gray-700 block mb-2">Cupom de Desconto</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Insira o código"
                  className="flex-1 border border-gray-300 rounded-xl px-3 py-2 outline-none focus:border-green-500 bg-white text-sm transition-colors"
                />
                <button className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-xl font-bold text-sm transition-colors">
                  Aplicar
                </button>
              </div>
            </div>

            <div className="border-t border-dashed border-gray-300 my-4" />

            <div className="flex justify-between items-end mb-6">
              <span className="font-extrabold text-gray-900">Total</span>
              <span className="text-2xl sm:text-3xl font-black text-green-600">{formatarMoeda(total)}</span>
            </div>

            <button className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-xl text-base mb-5 shadow-md shadow-green-600/25 transition-all hover:-translate-y-0.5">
              Finalizar Compra
            </button>

            {/* Selos de segurança */}
            <div className="pt-4 border-t border-gray-200 text-center">
              <div className="flex items-center gap-1.5 justify-center text-xs font-bold text-gray-400 mb-3">
                <ShieldCheck size={16} className="text-green-500" /> Pagamento 100% Seguro
              </div>
              <div className="flex items-center justify-center gap-2">
                {['VISA', 'MASTER', 'PIX', 'BOLETO'].map(m => (
                  <div key={m} className="bg-gray-200 px-2 py-1 rounded text-[10px] font-bold text-gray-500">{m}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
