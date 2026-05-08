'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useProdutosViewModel } from '../viewmodels/produtos.vm';
import ProdutoCard from '../components/ProdutoCard';
import HeroTexto from '../components/HeroTexto';
import { ArrowRight, Leaf, ShieldCheck, ThumbsUp, Truck } from 'lucide-react';
import { mockCategorias } from '../mocks/produtos.mock';

export default function HomePage() {
  const { produtos, carregando } = useProdutosViewModel();

  const ofertas = produtos.filter(p => p.tags.includes('desconto')).slice(0, 8);

  const laticinios = produtos
    .filter(p => p.categoria === 'frios-e-embutidos' && (
      p.nome.toLowerCase().includes('iogurte') ||
      p.nome.toLowerCase().includes('shake')   ||
      p.nome.toLowerCase().includes('flan')    ||
      p.nome.toLowerCase().includes('manteiga') ||
      p.nome.toLowerCase().includes('margarina')
    ))
    .slice(0, 8);

  const frios = produtos
    .filter(p => p.categoria === 'frios-e-embutidos' && (
      p.nome.toLowerCase().includes('frango') ||
      p.nome.toLowerCase().includes('salsicha') ||
      p.nome.toLowerCase().includes('linguiça') ||
      p.nome.toLowerCase().includes('miúdos') ||
      p.nome.toLowerCase().includes('peito') ||
      p.nome.toLowerCase().includes('hot wings')
    ))
    .slice(0, 8);

  const congelados = produtos
    .filter(p => p.categoria === 'congelados')
    .slice(0, 8);

  return (
    <div className="flex flex-col pb-16">

      {/* ── Hero ── */}
      <section className="relative bg-green-900 min-h-[320px] sm:min-h-[420px] lg:min-h-[460px] flex items-center overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=1600&q=80"
          alt="Supermercado Ekomart"
          fill
          sizes="100vw"
          className="object-cover opacity-25"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-green-900 via-green-900/70 to-transparent" />
        <div className="relative z-10 container mx-auto px-4 max-w-7xl pt-4 pb-16 sm:py-16">
          <div className="max-w-xl">
            <Image
              src="/gn.png"
              alt="Ekomart"
              width={499}
              height={241}
              className="h-15 w-auto mt-5 mb-10 sm:hidden"
            />
            <span className="hidden sm:inline-block bg-green-500 text-white text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-5">
              🔥 Ofertas da Semana
            </span>
            <HeroTexto />
            <div className="flex flex-wrap gap-3">
              <Link
                href="/produtos"
                className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-400 text-white font-bold py-3.5 px-7 rounded-full transition-all hover:scale-105 shadow-lg"
              >
                Ver Ofertas <ArrowRight size={18} />
              </Link>
              <Link
                href="/produtos"
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold py-3.5 px-7 rounded-full border border-white/20 transition-all backdrop-blur-sm"
              >
                Todas as Categorias
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Categorias ── */}
      <section className="container mx-auto px-4 max-w-7xl mt-6 sm:mt-10">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-extrabold text-gray-900">Comprar por categoria</h2>
          <Link href="/produtos" className="text-sm text-green-600 hover:underline font-medium flex items-center gap-1">
            Ver todas <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
          {mockCategorias.map(cat => (
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
      </section>

      {/* ── Diferenciais ── */}
      <section className="container mx-auto px-4 max-w-7xl mt-6 sm:mt-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { icon: <Truck size={20} />, titulo: 'Entrega Rápida', desc: 'Mesmo dia ou no dia seguinte' },
            { icon: <Leaf size={20} />, titulo: 'Produtos Frescos', desc: 'Direto dos produtores locais' },
            { icon: <ShieldCheck size={20} />, titulo: 'Compra Garantida', desc: 'Reembolso total garantido' },
            { icon: <ThumbsUp size={20} />, titulo: 'Melhor Qualidade', desc: 'Selecionados com cuidado' },
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

      {/* ── Ofertas do Dia ── */}
      <section className="container mx-auto px-4 max-w-7xl mt-8 sm:mt-12">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900">🔥 Ofertas do Dia</h2>
            <p className="text-sm text-gray-500 mt-1">Aproveite as melhores ofertas de hoje</p>
          </div>
          <Link href="/produtos" className="hidden sm:flex items-center gap-1 text-sm text-green-600 hover:underline font-medium">
            Ver todas <ArrowRight size={14} />
          </Link>
        </div>

        {carregando ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-gray-100 rounded-2xl aspect-square animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {ofertas.map(produto => (
              <ProdutoCard key={produto.id} produto={produto} />
            ))}
          </div>
        )}
      </section>

      {/* ── Banners Promo ── */}
      <section className="container mx-auto px-4 max-w-7xl mt-8 sm:mt-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 relative rounded-2xl overflow-hidden bg-gradient-to-r from-orange-500 to-amber-400 p-8 min-h-[200px] flex flex-col justify-between">
            <div>
              <p className="text-orange-100 text-xs font-bold uppercase tracking-widest mb-2">Hortifruti & Frutas</p>
              <h3 className="text-white text-3xl font-extrabold leading-tight">
                Frutas e Verduras<br />frescas até 40% OFF
              </h3>
            </div>
            <Link
              href="/produtos?categoria=hortifruti"
              className="self-start mt-5 bg-white text-orange-600 font-bold text-sm px-6 py-2.5 rounded-full hover:scale-105 transition-transform"
            >
              Comprar agora
            </Link>
          </div>
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-green-700 to-green-500 p-8 min-h-[200px] flex flex-col justify-between">
            <div>
              <p className="text-green-200 text-xs font-bold uppercase tracking-widest mb-2">Cesta Básica</p>
              <h3 className="text-white text-2xl font-extrabold leading-tight">
                Arroz, Feijão<br />e muito mais!
              </h3>
            </div>
            <Link
              href="/produtos?categoria=mercearia"
              className="self-start mt-5 bg-white text-green-700 font-bold text-sm px-6 py-2.5 rounded-full hover:scale-105 transition-transform"
            >
              Ver produtos
            </Link>
          </div>
        </div>
      </section>

      {/* ── Laticínios ── */}
      <section className="container mx-auto px-4 max-w-7xl mt-8 sm:mt-12">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900">🥛 Laticínios</h2>
            <p className="text-sm text-gray-500 mt-1">Iogurtes, manteigas, margarinas e mais</p>
          </div>
          <Link href="/produtos?categoria=frios-e-embutidos" className="hidden sm:flex items-center gap-1 text-sm text-green-600 hover:underline font-medium">
            Ver todos <ArrowRight size={14} />
          </Link>
        </div>
        {carregando ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-gray-100 rounded-2xl aspect-square animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {laticinios.map(produto => (
              <ProdutoCard key={produto.id} produto={produto} />
            ))}
          </div>
        )}
      </section>

      {/* ── Frios e Embutidos ── */}
      <section className="container mx-auto px-4 max-w-7xl mt-8 sm:mt-12">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900">🧀 Frios e Embutidos</h2>
            <p className="text-sm text-gray-500 mt-1">Frango, salsicha, linguiça e mais</p>
          </div>
          <Link href="/produtos?categoria=frios-e-embutidos" className="hidden sm:flex items-center gap-1 text-sm text-green-600 hover:underline font-medium">
            Ver todos <ArrowRight size={14} />
          </Link>
        </div>
        {carregando ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-gray-100 rounded-2xl aspect-square animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {frios.map(produto => (
              <ProdutoCard key={produto.id} produto={produto} />
            ))}
          </div>
        )}
      </section>

      {/* ── Congelados ── */}
      <section className="container mx-auto px-4 max-w-7xl mt-8 sm:mt-12">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900">❄️ Congelados</h2>
            <p className="text-sm text-gray-500 mt-1">Sorvetes, polpas, pratos prontos e mais</p>
          </div>
          <Link href="/produtos?categoria=congelados" className="hidden sm:flex items-center gap-1 text-sm text-green-600 hover:underline font-medium">
            Ver todos <ArrowRight size={14} />
          </Link>
        </div>
        {carregando ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-gray-100 rounded-2xl aspect-square animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {congelados.map(produto => (
              <ProdutoCard key={produto.id} produto={produto} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
