'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { AdminTableSkeleton } from '@/src/components/ui/Skeleton';
import { ColumnDef } from '@/src/components/admin/ui/DataTable';
import DataTable from '@/src/components/admin/ui/DataTable';
import Badge from '@/src/components/admin/ui/Badge';
import { formatarMoeda } from '@/src/utils/formatadores';

const STATUS_CONFIG: Record<string, { label: string; variant: any }> = {
  PENDING_PAYMENT: { label: 'Aguardando', variant: 'warning' },
  PROCESSING:      { label: 'Processando', variant: 'info' },
  PAID:            { label: 'Pago',        variant: 'success' },
  FAILED:          { label: 'Falhou',      variant: 'danger' },
  CANCELLED:       { label: 'Cancelado',   variant: 'default' },
};

export function ModalDetalhesPedido({ pedidoId, onClose }: { pedidoId: string, onClose: () => void }) {
  const [pedido, setPedido] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/pedidos/${pedidoId}`)
      .then(r => r.json())
      .then(data => {
        setPedido(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [pedidoId]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Detalhes do Pedido <span className="text-gray-500">#{pedidoId.slice(-8).toUpperCase()}</span></h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">Fechar</button>
        </div>

        {loading ? (
          <div className="flex justify-center p-8"><Loader2 className="animate-spin text-green-600" size={24} /></div>
        ) : !pedido ? (
          <p className="text-red-500">Erro ao carregar detalhes.</p>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Dados do Cliente */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <h3 className="font-bold mb-3 text-gray-900 border-b pb-2">Dados do Cliente</h3>
                <div className="space-y-2 text-sm text-gray-700">
                  <p><span className="font-semibold">Nome:</span> {pedido.compradorNome}</p>
                  <p><span className="font-semibold">E-mail:</span> {pedido.compradorEmail}</p>
                  <p><span className="font-semibold">CPF:</span> {pedido.compradorCpf}</p>
                  <p><span className="font-semibold">Telefone:</span> {pedido.compradorTelefone}</p>
                  {pedido.cliente && (
                    <div className="mt-2 pt-2 border-t text-xs text-blue-600">Cliente cadastrado no sistema</div>
                  )}
                </div>
              </div>

              {/* Dados de Pagamento */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <h3 className="font-bold mb-3 text-gray-900 border-b pb-2">Pagamento e Entrega</h3>
                <div className="space-y-2 text-sm text-gray-700">
                  <p><span className="font-semibold">Método:</span> {pedido.metodoPagamento}</p>
                  <p><span className="font-semibold">Status:</span> {STATUS_CONFIG[pedido.status]?.label || pedido.status}</p>
                  <p><span className="font-semibold">Tipo de Entrega:</span> {pedido.entregaTipo}</p>
                  {pedido.entregaTipo === 'ENTREGA' && (
                    <p className="text-xs text-gray-500 mt-1">
                      {pedido.logradouro}, {pedido.numero} {pedido.complemento ? `- ${pedido.complemento}` : ''}<br/>
                      {pedido.bairro}, {pedido.cidade} - {pedido.uf} | CEP: {pedido.cep}
                    </p>
                  )}
                  <p><span className="font-semibold mt-2 block">Total:</span> <span className="text-green-600 font-bold">{formatarMoeda(pedido.total)}</span></p>
                </div>
              </div>
            </div>

            {/* Itens do Pedido */}
            <div>
              <h3 className="font-bold mb-3 text-gray-900">Itens do Pedido</h3>
              <div className="divide-y border rounded-xl overflow-hidden border-gray-200">
                {pedido.items?.map((item: any) => (
                  <div key={item.id} className="flex justify-between items-center p-4 bg-white hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        {item.imagemProduto && <img src={item.imagemProduto} alt={item.nomeProduto} className="w-full h-full object-contain p-1" />}
                      </div>
                      <div>
                        <p className="font-medium text-sm text-gray-900">{item.nomeProduto}</p>
                        <p className="text-xs text-gray-500">{formatarMoeda(item.preco)} un.</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900 text-sm">{formatarMoeda(item.subtotal)}</p>
                      <p className="text-xs text-gray-500">Qtd: {item.quantidade}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-right space-y-1 text-sm">
                <p className="text-gray-500">Subtotal: {formatarMoeda(pedido.subtotal)}</p>
                <p className="text-gray-500">Frete: {formatarMoeda(pedido.frete)}</p>
                <p className="font-bold text-gray-900 text-lg">Total: {formatarMoeda(pedido.total)}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PageFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const set = (key: string, value: string) => {
    const p = new URLSearchParams(searchParams.toString());
    value ? p.set(key, value) : p.delete(key);
    p.set('page', '1');
    router.push(`${pathname}?${p.toString()}`);
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        value={searchParams.get('status') || ''}
        onChange={(e) => set('status', e.target.value)}
        className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500"
      >
        <option value="">Todos os status</option>
        {Object.entries(STATUS_CONFIG).map(([val, { label }]) => (
          <option key={val} value={val}>{label}</option>
        ))}
      </select>
    </div>
  );
}

function PedidosContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [pedidos, setPedidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [pedidoSelecionado, setPedidoSelecionado] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams(searchParams.toString());
      if (!q.get('page')) q.set('page', '1');
      const res = await fetch(`/api/admin/pedidos?${q.toString()}`);
      const json = await res.json();
      setPedidos(json.pedidos ?? []);
      setPagination({ page: json.page, totalPages: json.pages, total: json.total });
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => { carregar(); }, [carregar]);

  const setPage = (page: number) => {
    const p = new URLSearchParams(searchParams.toString());
    p.set('page', String(page));
    router.push(`${pathname}?${p.toString()}`);
  };

  const columns: ColumnDef<any>[] = [
    {
      header: 'Pedido',
      accessor: 'id',
      cell: (id) => <span className="font-mono text-xs text-gray-500">#{(id as string).slice(-8).toUpperCase()}</span>,
    },
    {
      header: 'Data',
      accessor: 'criadoEm',
      cell: (val) => <span className="text-xs">{new Date(val as string).toLocaleString('pt-BR')}</span>,
    },
    {
      header: 'Comprador',
      accessor: 'compradorNome',
      cell: (val, row) => (
        <div>
          <p className="font-medium text-sm text-gray-900">{val as string}</p>
          <p className="text-xs text-gray-400">{row.compradorEmail}</p>
        </div>
      ),
    },
    {
      header: 'Total',
      accessor: 'total',
      cell: (val) => <span className="font-bold text-gray-900">{formatarMoeda(val as number)}</span>,
    },
    {
      header: 'Método',
      accessor: 'metodoPagamento',
      cell: (val) => <span className="text-xs font-medium text-gray-500">{val as string}</span>,
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (val) => {
        const config = STATUS_CONFIG[val as string] || { label: val, variant: 'default' };
        return <Badge label={config.label} variant={config.variant} />;
      },
    },
    {
      header: 'Ações',
      accessor: 'id',
      cell: (id) => (
        <button
          onClick={() => setPedidoSelecionado(id as string)}
          className="text-xs font-medium text-green-600 hover:text-green-700 bg-green-50 px-3 py-1.5 rounded-full transition-colors"
        >
          Ver detalhes completos
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pedidos</h1>
          <p className="text-sm text-gray-500 mt-0.5">{pagination.total} pedido(s) encontrado(s)</p>
        </div>
      </div>

      <PageFilters />

      {loading ? (
        <AdminTableSkeleton rows={10} cols={7} />
      ) : (
        <DataTable columns={columns} data={pedidos} loading={false} pagination={pagination} onPageChange={setPage} />
      )}

      {pedidoSelecionado && (
        <ModalDetalhesPedido 
          pedidoId={pedidoSelecionado} 
          onClose={() => setPedidoSelecionado(null)} 
        />
      )}
    </div>
  );
}

export default function AdminPedidosPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-16"><Loader2 className="animate-spin text-green-600" size={28} /></div>}>
      <PedidosContent />
    </Suspense>
  );
}
