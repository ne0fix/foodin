'use client';

import Image from 'next/image';
import Link from 'next/link';
import ProdutoCard from '@/src/components/ProdutoCard';
import HeroTexto from '@/src/components/HeroTexto';
import { ArrowRight, Leaf, ShieldCheck, ThumbsUp, Truck } from 'lucide-react';
import { useHomeSecoesViewModel } from '@/src/viewmodels/home.vm';
import { useCategoriasViewModel } from '@/src/viewmodels/categorias.vm';
import { ProdutoCardSkeleton, Skeleton } from '@/src/components/ui/Skeleton';

export default function HomePage() {
  const { secoes, carregando: carregandoSecoes, erro: erroSecoes } = useHomeSecoesViewModel();
  const { categorias, carregando: carregandoCategorias, erro: erroCategorias } = useCategoriasViewModel();

  return (
    <div className="flex flex-col pb-16">

      {/* ── Hero ── */}
      <section className="relative bg-green-900 min-h-[320px] sm:min-h-[420px] lg:min-h-[460px] flex items-center overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1600&q=80"
          alt="foodin — Delivery de comida"
          fill
          sizes="100vw"
          className="object-cover opacity-60"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-green-900/50 via-green-900/20 to-transparent" />
        <div className="relative z-10 container mx-auto px-4 max-w-7xl pt-4 pb-16 sm:py-16">
          <div className="max-w-xl">
            <Image
              src="/foodin.png"
              alt="foodin"
              width={499}
              height={241}
              className="h-15 w-auto mt-5 mb-10 sm:hidden drop-shadow-lg"
            />
            <span className="hidden sm:inline-block bg-orange-500 text-white text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-5">
              🔥 Promoções do Dia
            </span>
            <HeroTexto />
            <div className="flex flex-wrap gap-3">
              <Link
                href="/produtos"
                className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-bold py-3.5 px-7 rounded-full transition-all hover:scale-105 shadow-lg"
              >
                Ver Cardápio <ArrowRight size={18} />
              </Link>
              <Link
                href="/produtos"
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold py-3.5 px-7 rounded-full border border-white/20 transition-all backdrop-blur-sm"
              >
                Todos os Pratos
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Categorias ── */}
      <section className="container mx-auto px-4 max-w-7xl mt-6 sm:mt-10">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-extrabold text-gray-900">Explorar o cardápio</h2>
          <Link href="/produtos" className="text-sm text-green-600 hover:underline font-medium flex items-center gap-1">
            Ver tudo <ArrowRight size={14} />
          </Link>
        </div>
        {carregandoCategorias ? (
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2 p-1">
                <div className="w-12 h-12 rounded-full bg-gray-100 animate-pulse" />
                <div className="h-4 w-10 bg-gray-100 rounded mt-2 animate-pulse" />
              </div>
            ))}
          </div>
        ) : erroCategorias ? (
            <p className="text-red-500 text-center col-span-full">{erroCategorias}</p>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
            {categorias.map(cat => (
              <Link
                key={cat.id}
                href={`/produtos?categoria=${cat.id}`}
                className="flex flex-col items-center gap-2 py-3 px-1 rounded-xl hover:bg-green-50 transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-gray-100 group-hover:bg-green-100 flex items-center justify-center text-2xl transition-colors shadow-sm">
                  {cat.icone}
                </div>
                <span className="text-[11px] font-medium text-gray-600 group-hover:text-green-700 text-center leading-tight">
                  {cat.nome}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ── Diferenciais ── */}
      <section className="container mx-auto px-4 max-w-7xl mt-6 sm:mt-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { icon: <Truck size={20} />, titulo: 'Entrega Rápida', desc: 'Seu pedido em minutos na sua porta' },
            { icon: <Leaf size={20} />, titulo: 'Pratos Frescos', desc: 'Preparados na hora, com ingredientes frescos' },
            { icon: <ShieldCheck size={20} />, titulo: 'Pedido Garantido', desc: 'Reembolso total se houver problema' },
            { icon: <ThumbsUp size={20} />, titulo: 'Pague do seu jeito', desc: 'PIX, cartão de crédito ou débito' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-100">
              <div className="text-green-600 bg-white p-2.5 rounded-lg shadow-sm flex-shrink-0">{item.icon}</div>
              <div>
                <p className="font-bold text-sm text-gray-900">{item.titulo}</p>
                <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Dynamic Product Sections ── */}
      {carregandoSecoes && !erroSecoes && (
        <>
          {Array.from({ length: 2 }).map((_, i) => (
            <section key={i} className="container mx-auto px-4 max-w-7xl mt-8 sm:mt-12">
              <Skeleton className="h-7 w-48 mb-2" />
              <Skeleton className="h-4 w-64 mb-5" />
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, j) => (
                  <ProdutoCardSkeleton key={j} />
                ))}
              </div>
            </section>
          ))}
        </>
      )}

      {erroSecoes && <p className="text-red-500 text-center py-10">{erroSecoes}</p>}

      {!carregandoSecoes && secoes.map(secao => (
        <section key={secao.id} className="container mx-auto px-4 max-w-7xl mt-8 sm:mt-12">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900">{secao.titulo}</h2>
              {secao.subtitulo && <p className="text-sm text-gray-500 mt-1">{secao.subtitulo}</p>}
            </div>
            <Link 
              href={`/produtos?${secao.filtroCategoriaId ? `categoria=${secao.filtroCategoriaId}` : (secao.filtroTag ? `tag=${secao.filtroTag}`: '')}`} 
              className="hidden sm:flex items-center gap-1 text-sm text-green-600 hover:underline font-medium"
            >
              Ver todos <ArrowRight size={14} />
            </Link>
          </div>
          {secao.produtos.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {secao.produtos.map(produto => (
                <ProdutoCard key={produto.id} produto={produto} />
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Nenhum prato encontrado para esta seção no momento.</p>
          )}
        </section>
      ))}


      {/* ── Banners Promo ── */}
      <section className="container mx-auto px-4 max-w-7xl mt-8 sm:mt-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 relative rounded-2xl overflow-hidden bg-gradient-to-r from-orange-500 to-amber-400 p-8 min-h-[200px] flex flex-col justify-between">
            <div>
              <p className="text-orange-100 text-xs font-bold uppercase tracking-widest mb-2">Hambúrgueres & Lanches</p>
              <h3 className="text-white text-3xl font-extrabold leading-tight">
                Os melhores lanches<br />até 40% OFF hoje
              </h3>
            </div>
            <Link
              href="/produtos"
              className="self-start mt-5 bg-white text-orange-600 font-bold text-sm px-6 py-2.5 rounded-full hover:scale-105 transition-transform"
            >
              Pedir agora
            </Link>
          </div>
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-green-700 to-green-500 p-8 min-h-[200px] flex flex-col justify-between">
            <div>
              <p className="text-green-200 text-xs font-bold uppercase tracking-widest mb-2">Pratos do Dia</p>
              <h3 className="text-white text-2xl font-extrabold leading-tight">
                Almoço e jantar<br />quentinhos!
              </h3>
            </div>
            <Link
              href="/produtos"
              className="self-start mt-5 bg-white text-green-700 font-bold text-sm px-6 py-2.5 rounded-full hover:scale-105 transition-transform"
            >
              Ver o cardápio
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
