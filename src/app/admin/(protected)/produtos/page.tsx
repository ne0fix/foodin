'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useDebounce } from 'use-debounce';
import Image from 'next/image';
import Link from 'next/link';
import { PlusCircle, Edit, Trash2, Loader2 } from 'lucide-react';
import { useCategoriasViewModel } from '@/src/viewmodels/categorias.vm';
import { ProdutoAdminDTO } from '@/src/lib/dto';
import { ColumnDef } from '@/src/components/admin/ui/DataTable';
import DataTable from '@/src/components/admin/ui/DataTable';
import Badge from '@/src/components/admin/ui/Badge';
import Toggle from '@/src/components/admin/ui/Toggle';
import ConfirmDialog from '@/src/components/admin/ui/ConfirmDialog';
import { formatarMoeda } from '@/src/utils/formatadores';

function PageFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { categorias } = useCategoriasViewModel();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [debouncedQuery] = useDebounce(query, 500);

  useEffect(() => {
    const p = new URLSearchParams(searchParams.toString());
    debouncedQuery ? p.set('q', debouncedQuery) : p.delete('q');
    p.set('page', '1');
    router.push(`${pathname}?${p.toString()}`);
  }, [debouncedQuery, pathname, router, searchParams]);

  const set = (key: string, value: string) => {
    const p = new URLSearchParams(searchParams.toString());
    value ? p.set(key, value) : p.delete(key);
    p.set('page', '1');
    router.push(`${pathname}?${p.toString()}`);
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <input
        type="text"
        placeholder="Buscar por nome..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-56 outline-none focus:border-green-500"
      />
      <select
        value={searchParams.get('categoria') || ''}
        onChange={(e) => set('categoria', e.target.value)}
        className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500"
      >
        <option value="">Todas as categorias</option>
        {categorias.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
      </select>
      <select
        value={searchParams.get('emEstoque') || ''}
        onChange={(e) => set('emEstoque', e.target.value)}
        className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500"
      >
        <option value="">Todo o estoque</option>
        <option value="true">Em estoque</option>
        <option value="false">Fora de estoque</option>
      </select>
    </div>
  );
}

function ProdutosContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [produtos, setProdutos] = useState<ProdutoAdminDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [excluindo, setExcluindo] = useState<ProdutoAdminDTO | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams(searchParams.toString());
      if (!q.get('page')) q.set('page', '1');
      const res = await fetch(`/api/admin/produtos?${q.toString()}`);
      const json = await res.json();
      setProdutos(json.data ?? []);
      setPagination({ page: json.page, totalPages: json.totalPages, total: json.total });
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => { carregar(); }, [carregar]);

  async function toggleEstoque(id: string, emEstoque: boolean) {
    await fetch(`/api/admin/produtos/${id}/estoque`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emEstoque }),
    });
    setProdutos((ps) => ps.map((p) => (p.id === id ? { ...p, emEstoque } : p)));
  }

  async function handleExcluir() {
    if (!excluindo) return;
    await fetch(`/api/admin/produtos/${excluindo.id}`, { method: 'DELETE' });
    setExcluindo(null);
    carregar();
  }

  const setPage = (page: number) => {
    const p = new URLSearchParams(searchParams.toString());
    p.set('page', String(page));
    router.push(`${pathname}?${p.toString()}`);
  };

  const columns: ColumnDef<ProdutoAdminDTO>[] = [
    {
      header: 'Produto',
      accessor: 'nome',
      cell: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
            <Image src={row.imagem} alt={row.nome} fill sizes="40px" className="object-contain p-0.5" onError={() => {}} />
          </div>
          <Link href={`/admin/produtos/${row.id}`} className="font-medium text-sm text-gray-900 hover:text-green-700 line-clamp-2">
            {row.nome}
          </Link>
        </div>
      ),
    },
    {
      header: 'Categoria',
      accessor: 'categoria',
      cell: (value) => <Badge label={value as string} variant="categoria" />,
    },
    {
      header: 'Preço',
      accessor: 'preco',
      cell: (value, row) => (
        <div>
          {row.precoOriginal && (
            <p className="text-xs text-gray-400 line-through">{formatarMoeda(row.precoOriginal)}</p>
          )}
          <span className="font-bold text-green-600">{formatarMoeda(value as number)}</span>
        </div>
      ),
    },
    {
      header: 'Estoque',
      accessor: 'emEstoque',
      cell: (value, row) => (
        <Toggle label="" checked={value as boolean} onChange={(checked) => toggleEstoque(row.id, checked)} />
      ),
    },
    {
      header: 'Tags',
      accessor: 'tags',
      cell: (value) => {
        const tags = value as string[];
        if (!tags?.length) return <span className="text-gray-300 text-xs">—</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {tags.map((t) => <Badge key={t} label={t} variant="tag" />)}
          </div>
        );
      },
    },
    {
      header: 'Ações',
      accessor: 'id',
      cell: (id, row) => (
        <div className="flex items-center gap-1">
          <Link href={`/admin/produtos/${id as string}`} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-900" title="Editar">
            <Edit size={15} />
          </Link>
          <button onClick={() => setExcluindo(row)} className="p-2 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600" title="Excluir">
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Produtos</h1>
          <p className="text-sm text-gray-500 mt-0.5">{pagination.total} produto(s) encontrado(s)</p>
        </div>
        <Link
          href="/admin/produtos/novo"
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold px-4 py-2 rounded-lg"
        >
          <PlusCircle size={16} /> Novo Produto
        </Link>
      </div>

      <PageFilters />

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-green-600" size={28} />
        </div>
      ) : (
        <DataTable columns={columns} data={produtos} loading={false} pagination={pagination} onPageChange={setPage} />
      )}

      <ConfirmDialog
        open={!!excluindo}
        titulo="Excluir produto"
        mensagem={`Tem certeza que deseja excluir "${excluindo?.nome}"? Esta ação não pode ser desfeita.`}
        labelConfirmar="Excluir"
        onConfirm={handleExcluir}
        onCancel={() => setExcluindo(null)}
      />
    </div>
  );
}

export default function AdminProdutosPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-16"><Loader2 className="animate-spin text-green-600" size={28} /></div>}>
      <ProdutosContent />
    </Suspense>
  );
}
