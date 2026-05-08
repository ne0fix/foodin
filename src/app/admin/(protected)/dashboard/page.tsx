import Link from 'next/link';
import prisma from '@/src/lib/prisma';
import { formatarMoeda } from '@/src/utils/formatadores';
import { Package, XCircle, Tag, LayoutList, ExternalLink, ArrowRight } from 'lucide-react';


async function getDashboardData() {
    const [totalProdutos, produtosSemEstoque, totalCategorias, totalSecoes, ultimosProdutos] = await Promise.all([
        prisma.produto.count({ where: { ativo: true } }),
        prisma.produto.count({ where: { emEstoque: false, ativo: true } }),
        prisma.categoria.count({ where: { ativo: true } }),
        prisma.secao.count({ where: { ativo: true } }),
        prisma.produto.findMany({
            where: { ativo: true },
            orderBy: { atualizadoEm: 'desc' },
            take: 5,
            include: { categoria: true },
        }),
    ]);

    return { totalProdutos, produtosSemEstoque, totalCategorias, totalSecoes, ultimosProdutos };
}


export default async function DashboardPage() {

    const { totalProdutos, produtosSemEstoque, totalCategorias, totalSecoes, ultimosProdutos } = await getDashboardData();
    
    const metricas = [
        { title: 'Total de Produtos', value: totalProdutos, icon: Package, color: 'text-blue-500' },
        { title: 'Produtos Sem Estoque', value: produtosSemEstoque, icon: XCircle, color: 'text-red-500' },
        { title: 'Categorias Ativas', value: totalCategorias, icon: Tag, color: 'text-yellow-500' },
        { title: 'Seções da Home', value: totalSecoes, icon: LayoutList, color: 'text-green-500' },
    ];

    return (
        <div className="space-y-8">
            <h1 className="text-2xl font-bold">Dashboard</h1>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {metricas.map(item => (
                    <div key={item.title} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center gap-4">
                        <div className={`p-3 rounded-full bg-gray-100 ${item.color}`}>
                           <item.icon size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">{item.title}</p>
                            <p className="text-2xl font-bold">{item.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Links Rápidos */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <h2 className="text-lg font-semibold mb-4">Links Rápidos</h2>
                <div className="flex flex-wrap gap-3">
                    <a
                        href="/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-green-300 hover:text-green-700 transition-colors"
                    >
                        <ExternalLink size={15} /> Ver site
                    </a>
                    <Link
                        href="/admin/produtos"
                        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-green-300 hover:text-green-700 transition-colors"
                    >
                        <ArrowRight size={15} /> Ir para Produtos
                    </Link>
                    <Link
                        href="/admin/secoes"
                        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-green-300 hover:text-green-700 transition-colors"
                    >
                        <ArrowRight size={15} /> Configurar Seções
                    </Link>
                    <Link
                        href="/admin/produtos/novo"
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-sm font-bold text-white hover:bg-green-700 transition-colors"
                    >
                        <Package size={15} /> Novo Produto
                    </Link>
                </div>
            </div>

            {/* Recent Products Table */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <h2 className="text-lg font-semibold mb-4">Últimos Produtos Atualizados</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">Produto</th>
                                <th scope="col" className="px-6 py-3">Categoria</th>
                                <th scope="col" className="px-6 py-3">Preço</th>
                                <th scope="col" className="px-6 py-3">Últ. Atualização</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ultimosProdutos.map(produto => (
                                <tr key={produto.id} className="bg-white border-b hover:bg-gray-50">
                                    <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                                        {produto.nome}
                                    </th>
                                    <td className="px-6 py-4">
                                        {/* Placeholder for Badge component */}
                                        <span className="px-2 py-1 text-xs font-medium text-blue-800 bg-blue-100 rounded-full">{produto.categoria.nome}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {formatarMoeda(produto.preco.toNumber())}
                                    </td>
                                    <td className="px-6 py-4">
                                        {new Date(produto.atualizadoEm).toLocaleDateString('pt-BR')}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
