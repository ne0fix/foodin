import Link from 'next/link';
import prisma from '@/src/lib/prisma';

export const dynamic = 'force-dynamic';
import ProductThumb from '@/src/components/admin/ui/ProductThumb';
import { formatarMoeda } from '@/src/utils/formatadores';
import {
  Package, AlertTriangle, Tag, LayoutList,
  ExternalLink, Plus, Settings2, TrendingUp,
  ArrowUpRight,
} from 'lucide-react';

async function getDashboardData() {
  // Uma única query SQL consolida as 4 contagens — usa só 1 conexão do pool
  const [metricas, ultimosProdutos] = await Promise.all([
    prisma.$queryRaw<{ total_produtos: bigint; sem_estoque: bigint; total_categorias: bigint; total_secoes: bigint }[]>`
      SELECT
        (SELECT COUNT(*) FROM "Produto"  WHERE ativo = true)               AS total_produtos,
        (SELECT COUNT(*) FROM "Produto"  WHERE ativo = true AND "emEstoque" = false) AS sem_estoque,
        (SELECT COUNT(*) FROM "Categoria" WHERE ativo = true)              AS total_categorias,
        (SELECT COUNT(*) FROM "Secao"    WHERE ativo = true)               AS total_secoes
    `,
    prisma.produto.findMany({
      where: { ativo: true },
      orderBy: { atualizadoEm: 'desc' },
      take: 5,
      include: { categoria: true },
    }),
  ]);

  const m = metricas[0];
  const totalProdutos      = Number(m.total_produtos);
  const produtosSemEstoque = Number(m.sem_estoque);
  const totalCategorias    = Number(m.total_categorias);
  const totalSecoes        = Number(m.total_secoes);

  return { totalProdutos, produtosSemEstoque, totalCategorias, totalSecoes, ultimosProdutos };
}

export default async function DashboardPage() {
  const { totalProdutos, produtosSemEstoque, totalCategorias, totalSecoes, ultimosProdutos } =
    await getDashboardData();

  const metricas = [
    {
      title: 'Produtos Ativos',
      value: totalProdutos,
      icon: Package,
      gradient: 'from-blue-500 to-blue-600',
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      sub: 'No catálogo',
    },
    {
      title: 'Sem Estoque',
      value: produtosSemEstoque,
      icon: AlertTriangle,
      gradient: 'from-red-500 to-rose-600',
      bg: 'bg-red-50',
      text: 'text-red-600',
      sub: 'Requer atenção',
    },
    {
      title: 'Categorias',
      value: totalCategorias,
      icon: Tag,
      gradient: 'from-violet-500 to-purple-600',
      bg: 'bg-violet-50',
      text: 'text-violet-600',
      sub: 'Ativas',
    },
    {
      title: 'Seções da Home',
      value: totalSecoes,
      icon: LayoutList,
      gradient: 'from-emerald-500 to-green-600',
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      sub: 'Configuradas',
    },
  ];

  const hora = new Date().getHours();
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';

  return (
    <div className="space-y-8 pb-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-green-600 text-sm font-medium">{saudacao}! 👋</p>
          <h1 className="text-2xl font-bold text-gray-900 mt-0.5">Painel Administrativo</h1>
          <p className="text-gray-400 text-sm mt-0.5">Visão geral do seu supermercado online</p>
        </div>
        <div className="hidden md:flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-4 py-2.5">
          <TrendingUp size={16} className="text-green-600" />
          <span className="text-green-700 text-sm font-semibold">{totalProdutos} produtos ativos</span>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {metricas.map((m) => {
          const Icon = m.icon;
          return (
            <div
              key={m.title}
              className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-11 h-11 rounded-xl ${m.bg} flex items-center justify-center`}>
                  <Icon size={20} className={m.text} />
                </div>
                <ArrowUpRight size={16} className="text-gray-300" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{m.value}</p>
              <p className="text-sm font-semibold text-gray-700 mt-0.5">{m.title}</p>
              <p className="text-xs text-gray-400 mt-0.5">{m.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Conteúdo principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Últimos produtos */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
            <h2 className="font-bold text-gray-900">Últimos Produtos Atualizados</h2>
            <Link
              href="/admin/produtos"
              className="text-xs font-semibold text-green-600 hover:text-green-700 flex items-center gap-1"
            >
              Ver todos <ArrowUpRight size={13} />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {ultimosProdutos.map((produto) => (
              <Link
                key={produto.id}
                href={`/admin/produtos/${produto.id}`}
                className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50/60 transition-colors group"
              >
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200 flex items-center justify-center">
                  <ProductThumb
                    src={produto.imagem}
                    alt={produto.nome}
                    className="w-full h-full object-contain p-1"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate group-hover:text-green-700 transition-colors">
                    {produto.nome}
                  </p>
                  <span className="inline-block mt-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                    {produto.categoria.nome}
                  </span>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-gray-900">{formatarMoeda(produto.preco.toNumber())}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {new Date(produto.atualizadoEm).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Ações rápidas */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-bold text-gray-900 mb-4">Ações Rápidas</h2>
            <div className="space-y-2.5">
              <Link
                href="/admin/produtos/novo"
                className="flex items-center gap-3 w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-green-600/20 hover:-translate-y-0.5"
              >
                <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
                  <Plus size={14} />
                </div>
                Novo Produto
              </Link>
              <Link
                href="/admin/secoes"
                className="flex items-center gap-3 w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold border border-gray-200 transition-colors"
              >
                <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center">
                  <Settings2 size={14} className="text-violet-600" />
                </div>
                Configurar Seções
              </Link>
              <Link
                href="/admin/categorias"
                className="flex items-center gap-3 w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold border border-gray-200 transition-colors"
              >
                <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Tag size={14} className="text-blue-600" />
                </div>
                Gerenciar Categorias
              </Link>
              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold border border-gray-200 transition-colors"
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <ExternalLink size={14} className="text-emerald-600" />
                </div>
                Ver Site
              </a>
            </div>
          </div>

          {/* Alerta estoque */}
          {produtosSemEstoque > 0 && (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle size={16} className="text-red-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-red-700">Estoque Baixo</p>
                  <p className="text-xs text-red-500 mt-0.5">
                    {produtosSemEstoque} produto{produtosSemEstoque > 1 ? 's' : ''} sem estoque
                  </p>
                  <Link
                    href="/admin/produtos?emEstoque=false"
                    className="inline-block mt-2 text-xs font-bold text-red-600 hover:underline"
                  >
                    Ver produtos →
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
