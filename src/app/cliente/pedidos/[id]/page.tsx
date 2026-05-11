'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, Package, MapPin, CreditCard, Copy, CheckCircle2, QrCode } from 'lucide-react';
import { StatusBadge } from '@/src/components/ui/StatusBadge';
import { OrderTimeline } from '@/src/components/ui/OrderTimeline';
import { formatarMoeda } from '@/src/utils/formatadores';

interface Item {
  id: string;
  nomeProduto: string;
  imagemProduto: string;
  quantidade: number;
  preco: number;
  subtotal: number;
}

interface Pedido {
  id: string;
  numero: string;
  statusCliente: string;
  total: number;
  subtotal: number;
  frete: number;
  metodoPagamento: string;
  entregaTipo: string;
  endereco: {
    logradouro: string;
    numero: string;
    bairro: string;
    cidade: string;
    uf: string;
    cep: string;
  };
  mpQrCode?: string;
  mpQrCodeBase64?: string;
  criadoEm: string;
  pagoEm?: string;
  items: Item[];
}

export default function PedidoDetalhePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    fetch(`/api/cliente/pedidos/${id}`)
      .then(res => res.json())
      .then(data => { if (data.id) setPedido(data); })
      .catch(err => console.error(err))
      .finally(() => setCarregando(false));
  }, [id]);

  // Polling enquanto aguarda confirmação de pagamento
  useEffect(() => {
    const aguardando =
      pedido?.statusCliente === 'PEDIDO_REALIZADO' ||
      pedido?.statusCliente === 'PAGAMENTO_PROCESSANDO';
    if (!aguardando) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/cliente/pedidos/${id}`);
        const data = await res.json();
        if (data.id) setPedido(data);
      } catch { /* silencioso */ }
    }, 5000);

    return () => clearInterval(interval);
  }, [id, pedido?.statusCliente]);

  const handleCopiarPix = () => {
    if (pedido?.mpQrCode) {
      navigator.clipboard.writeText(pedido.mpQrCode);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    }
  };

  if (carregando) {
    return (
      <div className="py-12 flex justify-center">
        <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!pedido) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-gray-500 font-bold">Pedido não encontrado.</p>
        <Link href="/cliente/pedidos" className="text-green-600 font-bold hover:underline">
          Voltar para meus pedidos
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3 overflow-x-hidden w-full">

      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-green-600 font-medium transition-colors"
        >
          <ChevronLeft size={18} />
          Voltar
        </button>
        <div className="text-right">
          <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Pedido</p>
          <p className="text-sm font-black text-gray-900">#{pedido.numero}</p>
        </div>
      </div>

      {/* Status e Timeline */}
      <section className="bg-white rounded-xl border border-gray-100 p-3 sm:p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="space-y-1">
            <p className="text-xs text-gray-500">
              Realizado em {new Date(pedido.criadoEm).toLocaleDateString('pt-BR')} às {new Date(pedido.criadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </p>
            <div className="mt-0.5">
              <StatusBadge status={pedido.statusCliente} />
            </div>
          </div>
          {pedido.pagoEm && (
            <div className="bg-green-50 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 self-start sm:self-auto">
              <CheckCircle2 size={13} className="text-green-600 flex-shrink-0" />
              <span className="text-[10px] font-bold text-green-700">
                Pago em {new Date(pedido.pagoEm).toLocaleDateString('pt-BR')}
              </span>
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-gray-100">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Progresso do Pedido</p>
          <div className="overflow-hidden">
            <OrderTimeline statusAtual={pedido.statusCliente} entregaTipo={pedido.entregaTipo} />
          </div>
        </div>
      </section>

      {/* PIX Pendente */}
      {(pedido.statusCliente === 'PEDIDO_REALIZADO' || pedido.statusCliente === 'PAGAMENTO_PROCESSANDO') &&
        pedido.metodoPagamento === 'PIX' && pedido.mpQrCode && (
        <section className="bg-green-600 text-white rounded-xl p-3 sm:p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <QrCode size={20} />
              <h3 className="text-base font-black">Aguardando Pagamento</h3>
            </div>
            <div className="flex items-center gap-1.5 bg-white/20 px-2 py-1 rounded-lg">
              <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              <span className="text-[10px] font-bold text-white/90">Verificando</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6 bg-white/10 p-3 rounded-xl border border-white/20">
            {pedido.mpQrCodeBase64 && (
              <div className="bg-white p-1.5 rounded-lg flex-shrink-0">
                <Image
                  src={`data:image/png;base64,${pedido.mpQrCodeBase64}`}
                  alt="QR Code PIX"
                  width={110}
                  height={110}
                  className="rounded-md w-24 h-24 sm:w-[130px] sm:h-[130px]"
                />
              </div>
            )}
            <div className="flex-1 min-w-0 space-y-3 text-center sm:text-left">
              <p className="text-xs font-medium text-white/90">
                Escaneie o QR Code ou copie o código abaixo para pagar no app do seu banco.
              </p>
              <button
                onClick={handleCopiarPix}
                className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-bold transition-all min-h-[44px] text-sm
                  ${copiado ? 'bg-white text-green-600' : 'bg-green-500 hover:bg-green-400 text-white'}`}
              >
                {copiado ? <CheckCircle2 size={17} /> : <Copy size={17} />}
                {copiado ? 'CÓDIGO COPIADO!' : 'COPIAR CÓDIGO PIX'}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Itens do Pedido */}
      <section className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="p-3 sm:p-5 border-b border-gray-100">
          <h3 className="font-bold text-gray-900 flex items-center gap-2 text-sm">
            <Package size={16} className="text-gray-400" />
            Itens do Pedido
          </h3>
        </div>

        <div className="divide-y divide-gray-100">
          {pedido.items.map(item => (
            <div key={item.id} className="p-3 flex items-center gap-2.5">
              <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden border border-gray-100 flex-shrink-0">
                <Image src={item.imagemProduto} alt={item.nomeProduto} fill className="object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{item.nomeProduto}</p>
                <p className="text-xs text-gray-500">{item.quantidade} × {formatarMoeda(item.preco)}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-bold text-gray-900">{formatarMoeda(item.subtotal)}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-gray-50 p-3 sm:p-5 space-y-1.5">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Subtotal</span>
            <span>{formatarMoeda(pedido.subtotal)}</span>
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>Frete</span>
            <span>{pedido.frete === 0 ? 'Grátis' : formatarMoeda(pedido.frete)}</span>
          </div>
          <div className="flex justify-between text-base font-black text-gray-900 pt-2 border-t border-gray-200">
            <span>Total</span>
            <span className="text-green-600">{formatarMoeda(pedido.total)}</span>
          </div>
        </div>
      </section>

      {/* Pagamento e Entrega */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
            <CreditCard size={14} className="text-gray-400 flex-shrink-0" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Pagamento</h3>
          </div>
          <div className="px-4 py-3">
            <p className="text-sm font-bold text-gray-900">{pedido.metodoPagamento}</p>
            <p className="text-xs text-gray-400 mt-0.5">Processado via Mercado Pago</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
            <MapPin size={14} className="text-gray-400 flex-shrink-0" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Entrega</h3>
          </div>
          <div className="px-4 py-3">
            {pedido.entregaTipo === 'RETIRADA' ? (
              <div className="space-y-0.5">
                <p className="text-sm font-bold text-gray-900">Retirada em Loja</p>
                <p className="text-xs text-gray-600">Av. XVII, 404 - Sen. Carlos Jereissati</p>
                <p className="text-xs text-gray-600">Pacatuba - CE · CEP 61800-000</p>
                <p className="text-xs text-gray-600">(85) 99113-5449</p>
                <p className="text-xs text-gray-400 mt-1">Aguarde o status &quot;Liberado&quot; para retirar</p>
              </div>
            ) : (
              <div className="space-y-0.5">
                <p className="text-sm font-bold text-gray-900 truncate">{pedido.endereco.logradouro}, {pedido.endereco.numero}</p>
                <p className="text-xs text-gray-600">{pedido.endereco.bairro}</p>
                <p className="text-xs text-gray-600">{pedido.endereco.cidade} - {pedido.endereco.uf}</p>
                <p className="text-xs text-gray-400 mt-0.5">CEP: {pedido.endereco.cep}</p>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
