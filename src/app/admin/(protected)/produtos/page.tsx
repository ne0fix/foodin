'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useDebounce } from 'use-debounce';
import Link from 'next/link';
import { PlusCircle, Edit, Trash2, Loader2, Check, X, Pencil, ShoppingBag, Package } from 'lucide-react';
import { AdminTableSkeleton } from '@/src/components/ui/Skeleton';
import { useCategoriasViewModel } from '@/src/viewmodels/categorias.vm';
import { ProdutoAdminDTO } from '@/src/lib/dto';
import { ColumnDef } from '@/src/components/admin/ui/DataTable';
import DataTable from '@/src/components/admin/ui/DataTable';
import Badge from '@/src/components/admin/ui/Badge';
import Toggle from '@/src/components/admin/ui/Toggle';
import ConfirmDialog from '@/src/components/admin/ui/ConfirmDialog';
import { formatarMoeda } from '@/src/utils/formatadores';

// ─── Célula de estoque com edição inline e barra de progresso ────────────────
function CelulaEstoque({
  produto,
  onToggle,
  onQtdAtualizada,
}: {
  produto: ProdutoAdminDTO;
  onToggle: (id: string, emEstoque: boolean) => void;
  onQtdAtualizada: (id: string, novaQtd: number) => void;
}) {
  const [editando, setEditando] = useState(false);
  const [qtdInput, setQtdInput] = useState(String(produto.estoqueQuantidade));
  const [salvando, setSalvando] = useState(false);

  const rastreado = produto.estoqueQuantidade >= 0;
  const totalOriginal = rastreado ? produto.estoqueQuantidade + produto.vendidos : 0;
  const porcentagemVendida = totalOriginal > 0 ? Math.min((produto.vendidos / totalOriginal) * 100, 100) : 0;
  const semEstoque = rastreado && produto.estoqueQuantidade === 0;

  const salvar = async () => {
    const novaQtd = parseInt(qtdInput);
    if (isNaN(novaQtd) || novaQtd < -1) return;
    setSalvando(true);
    try {
      await fetch(`/api/admin/produtos/${produto.id}/estoque`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emEstoque: produto.emEstoque, estoqueQuantidade: novaQtd }),
      });
      onQtdAtualizada(produto.id, novaQtd);
      setEditando(false);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="space-y-2 min-w-[160px]">
      {/* Toggle disponibilidade */}
      <Toggle
        label=""
        checked={produto.emEstoque}
        onChange={(checked) => onToggle(produto.id, checked)}
      />

      {/* Dados de quantidade */}
      {rastreado ? (
        <div className="space-y-1">
          {/* Quantidade atual com edição */}
          {editando ? (
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="-1"
                value={qtdInput}
                onChange={e => setQtdInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') salvar(); if (e.key === 'Escape') setEditando(false); }}
                className="w-20 border border-gray-300 rounded px-1.5 py-0.5 text-xs outline-none focus:border-green-500"
                autoFocus
              />
              <button onClick={salvar} disabled={salvando}
                className="text-green-600 hover:text-green-700 disabled:opacity-50">
                <Check size={13} />
              </button>
              <button onClick={() => setEditando(false)} className="text-gray-400 hover:text-gray-600">
                <X size={13} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => { setQtdInput(String(produto.estoqueQuantidade)); setEditando(true); }}
              className="flex items-center gap-1 group"
            >
              <Package size={12} className={semEstoque ? 'text-red-400' : 'text-gray-400'} />
              <span className={`text-xs font-bold ${semEstoque ? 'text-red-500' : 'text-gray-700'}`}>
                {produto.estoqueQuantidade} un
              </span>
              <Pencil size={10} className="text-gray-300 group-hover:text-green-500 transition-colors" />
            </button>
          )}

          {/* Barra de progresso vendidos / total */}
          {totalOriginal > 0 && (
            <div>
              <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-1.5 rounded-full transition-all ${
                    porcentagemVendida >= 90 ? 'bg-red-400' :
                    porcentagemVendida >= 60 ? 'bg-amber-400' : 'bg-green-500'
                  }`}
                  style={{ width: `${porcentagemVendida}%` }}
                />
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <ShoppingBag size={10} className="text-gray-400" />
                <span className="text-[10px] text-gray-400">
                  {produto.vendidos} vendido{produto.vendidos !== 1 ? 's' : ''} de {totalOriginal}
                </span>
              </div>
            </div>
          )}

          {totalOriginal === 0 && produto.vendidos > 0 && (
            <div className="flex items-center gap-1">
              <ShoppingBag size={10} className="text-gray-400" />
              <span className="text-[10px] text-gray-400">{produto.vendidos} vendido{produto.vendidos !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-0.5">
          <button
            onClick={() => { setQtdInput('0'); setEditando(true); }}
            className="flex items-center gap-1 group text-xs text-gray-400 hover:text-green-600 transition-colors"
          >
            <Package size={11} />
            <span>Ilimitado</span>
            <Pencil size={10} className="text-gray-300 group-hover:text-green-500 transition-colors" />
          </button>
          {produto.vendidos > 0 && (
            <div className="flex items-center gap-1">
              <ShoppingBag size={10} className="text-gray-400" />
              <span className="text-[10px] text-gray-400">{produto.vendidos} vendido{produto.vendidos !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PageFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { categorias } = useCategoriasViewModel();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [debouncedQuery] = useDebounce(query, 500);
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }
    const p = new URLSearchParams(searchParams.toString());
    debouncedQuery ? p.set('q', debouncedQuery) : p.delete('q');
    p.set('page', '1');
    router.push(`${pathname}?${p.toString()}`);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery]);

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

  function atualizarQtdLocal(id: string, novaQtd: number) {
    setProdutos((ps) => ps.map((p) =>
      p.id === id ? { ...p, estoqueQuantidade: novaQtd, emEstoque: novaQtd !== 0 ? p.emEstoque : false } : p
    ));
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
          <div className="w-10 h-10 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
            <img
              src={row.imagem}
              alt={row.nome}
              className="w-full h-full object-contain p-0.5"
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/foodin.png'; }}
            />
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
      cell: (_, row) => (
        <CelulaEstoque
          produto={row}
          onToggle={toggleEstoque}
          onQtdAtualizada={atualizarQtdLocal}
        />
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
        <AdminTableSkeleton rows={10} cols={6} />
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
