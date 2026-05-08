'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useDebounce } from 'use-debounce';
import { useAdminProdutos } from '@/src/viewmodels/adminProdutos.vm';
import { useCategoriasViewModel } from '@/src/viewmodels/categorias.vm';
import { ColumnDef, DataTable } from '@/src/components/admin/ui/DataTable';
import { ProdutoAdminDTO } from '@/src/lib/dto';
import { Badge } from '@/src/components/admin/ui/Badge';
import Toggle from '@/src/components/admin/ui/Toggle';
import { formatarMoeda } from '@/src/utils/formatadores';
import Image from 'next/image';
import Link from 'next/link';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '@/src/components/admin/ui/ConfirmDialog';

function PageFilters() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { categorias, carregando: loadingCategorias } = useCategoriasViewModel();

    const [query, setQuery] = useState(searchParams.get('q') || '');
    const [debouncedQuery] = useDebounce(query, 500);

    useEffect(() => {
        const newParams = new URLSearchParams(searchParams.toString());
        if (debouncedQuery) {
            newParams.set('q', debouncedQuery);
        } else {
            newParams.delete('q');
        }
        newParams.set('page', '1');
        router.push(`${pathname}?${newParams.toString()}`);
    }, [debouncedQuery, pathname, router]);

    const handleFilterChange = (key: string, value: string) => {
        const newParams = new URLSearchParams(searchParams.toString());
        if (value) {
            newParams.set(key, value);
        } else {
            newParams.delete(key);
        }
        newParams.set('page', '1');
        router.push(`${pathname}?${newParams.toString()}`);
    };

    return (
        <div className="flex flex-wrap items-center gap-4">
            <input 
                type="text"
                placeholder="Buscar por nome..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 w-full max-w-xs"
            />
            <select
                value={searchParams.get('categoria') || ''}
                onChange={(e) => handleFilterChange('categoria', e.target.value)}
                disabled={loadingCategorias}
                className="border border-gray-300 rounded-md px-3 py-2"
            >
                <option value="">Todas as categorias</option>
                {categorias.map(cat => <option key={cat.id} value={cat.id}>{cat.nome}</option>)}
            </select>
            <select
                value={searchParams.get('emEstoque') || ''}
                onChange={(e) => handleFilterChange('emEstoque', e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2"
            >
                <option value="">Todo o estoque</option>
                <option value="true">Em estoque</option>
                <option value="false">Fora de estoque</option>
            </select>
             <select
                value={searchParams.get('ativo') || ''}
                onChange={(e) => handleFilterChange('ativo', e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2"
            >
                <option value="">Todos</option>
                <option value="true">Ativos</option>
                <option value="false">Inativos</option>
            </select>
        </div>
    );
}

function AdminProdutosPageContent() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const { produtos, loading, pagination, toggleEstoque, deleteProduto, refetch } = useAdminProdutos();
    
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedProduto, setSelectedProduto] = useState<ProdutoAdminDTO | null>(null);

    const handleDeleteClick = (produto: ProdutoAdminDTO) => {
        setSelectedProduto(produto);
        setDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (selectedProduto) {
            await deleteProduto(selectedProduto.id);
            // After deletion, we might want to refetch to ensure pagination is correct
            refetch();
        }
    };
    
    const columns: ColumnDef<ProdutoAdminDTO>[] = [
        {
            header: 'Produto',
            accessor: 'nome',
            cell: (_, row) => (
                <div className="flex items-center gap-3">
                    <Image src={row.imagem} alt={row.nome} width={40} height={40} className="rounded-md object-cover bg-gray-100" />
                    <span className="font-medium">{row.nome}</span>
                </div>
            )
        },
        {
            header: 'Categoria',
            accessor: 'categoria',
            cell: (value) => <Badge label={value} variant="categoria" />,
        },
        {
            header: 'Preço',
            accessor: 'preco',
            cell: (value, row) => (
                <div>
                    <span className={row.precoOriginal ? 'line-through text-gray-500 text-xs' : ''}>{formatarMoeda(value)}</span>
                    {row.precoOriginal && <p className="font-semibold text-red-600">{formatarMoeda(row.precoOriginal)}</p>}
                </div>
            ),
        },
        {
            header: 'Estoque',
            accessor: 'emEstoque',
            cell: (value, row) => (
                <Toggle 
                    label=""
                    checked={value} 
                    onChange={(checked) => toggleEstoque(row.id, checked)}
                />
            ),
        },
        {
            header: 'Status',
            accessor: 'ativo',
            cell: (value) => <Badge label={value ? 'Ativo' : 'Inativo'} variant={value ? 'success' : 'danger'} />,
        },
        {
            header: 'Ações',
            accessor: 'id',
            cell: (id, row) => (
                <div className="flex items-center gap-2">
                    <Link href={`/admin/produtos/${id}`} className="p-2 hover:bg-gray-100 rounded-md" title="Editar">
                        <Edit size={16} />
                    </Link>
                    <button onClick={() => handleDeleteClick(row)} className="p-2 hover:bg-gray-100 rounded-md text-red-600" title="Excluir">
                        <Trash2 size={16} />
                    </button>
                </div>
            )
        }
    ];

    const setPage = (page: number) => {
        const newParams = new URLSearchParams(searchParams.toString());
        newParams.set('page', String(page));
        router.push(`${pathname}?${newParams.toString()}`);
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Produtos</h1>
                <Link href="/admin/produtos/novo" className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
                    <PlusCircle size={18} />
                    Novo Produto
                </Link>
            </div>

            <PageFilters />
            
            <DataTable
                columns={columns}
                data={produtos}
                loading={loading}
                pagination={pagination}
                onPageChange={setPage}
            />

            {selectedProduto && (
                <ConfirmDialog
                    open={dialogOpen}
                    onClose={() => setDialogOpen(false)}
                    onConfirm={handleConfirmDelete}
                    title="Confirmar Exclusão"
                    message={`Tem certeza que deseja excluir o produto "${selectedProduto?.nome}"? Esta ação não pode ser desfeita.`}
                    confirmLabel="Excluir"
                />
            )}
        </div>
    );
}


export default function AdminProdutosPage() {
    return (
        <Suspense fallback={<div>Carregando filtros...</div>}>
            <AdminProdutosPageContent />
        </Suspense>
    )
}
