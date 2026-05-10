'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, Package, MapPin, CreditCard, Copy, CheckCircle2, Loader2, QrCode } from 'lucide-react';
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
      .then(data => {
        if (data.id) setPedido(data);
      })
      .catch(err => console.error(err))
      .finally(() => setCarregando(false));
  }, [id]);

  const handleCopiarPix = () => {
    if (pedido?.mpQrCode) {
      navigator.clipboard.writeText(pedido.mpQrCode);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    }
  };

  if (carregando) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="animate-spin text-green-600" size={40} />
      </div>
    );
  }

  if (!pedido) {
    return (
      <div className="text-center py-20 space-y-4">
        <p className="text-gray-500 font-bold">Pedido não encontrado.</p>
        <Link href="/cliente/pedidos" className="text-green-600 font-bold hover:underline">
          Voltar para meus pedidos
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-500 hover:text-green-600 font-bold transition-colors">
          <ChevronLeft size={20} />
          Voltar
        </button>
        <div className="text-right">
          <p className="text-xs text-gray-400 uppercase font-black tracking-widest">Pedido</p>
          <p className="text-lg font-black text-gray-900">#{pedido.numero}</p>
        </div>
      </div>

      {/* Status e Timeline */}
      <section className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 space-y-5 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="space-y-1">
            <p className="text-xs sm:text-sm text-gray-500">
              Realizado em {new Date(pedido.criadoEm).toLocaleDateString('pt-BR')} às {new Date(pedido.criadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </p>
            <div className="mt-1">
              <StatusBadge status={pedido.statusCliente} />
            </div>
          </div>
          {pedido.pagoEm && (
            <div className="bg-green-50 px-3 py-2 rounded-xl flex items-center gap-2 self-start sm:self-auto">
              <CheckCircle2 size={16} className="text-green-600" />
              <span className="text-[11px] sm:text-xs font-bold text-green-700">Pago em {new Date(pedido.pagoEm).toLocaleDateString('pt-BR')}</span>
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-gray-100">
          <p className="text-[11px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 sm:mb-4">Progresso do Pedido</p>
          <div className="w-full">
            <OrderTimeline statusAtual={pedido.statusCliente} entregaTipo={pedido.entregaTipo} />
          </div>
        </div>
      </section>

      {/* PIX Pendente */}
      {(pedido.statusCliente === 'PEDIDO_REALIZADO' || pedido.statusCliente === 'PAGAMENTO_PROCESSANDO') && pedido.metodoPagamento === 'PIX' && pedido.mpQrCode && (
        <section className="bg-green-600 text-white rounded-2xl p-5 sm:p-6 shadow-lg space-y-5">
          <div className="flex items-center gap-3">
            <QrCode size={24} className="sm:w-7 sm:h-7" />
            <h3 className="text-lg sm:text-xl font-black">Aguardando Pagamento</h3>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-5 sm:gap-8 bg-white/10 p-5 sm:p-6 rounded-2xl backdrop-blur-sm border border-white/20">
            {pedido.mpQrCodeBase64 && (
              <div className="bg-white p-2 rounded-xl flex-shrink-0">
                <Image 
                  src={`data:image/png;base64,${pedido.mpQrCodeBase64}`}
                  alt="QR Code PIX"
                  width={140}
                  height={140}
                  className="rounded-lg w-32 h-32 sm:w-[150px] sm:h-[150px]"
                />
              </div>
            )}
            <div className="flex-1 space-y-4 text-center sm:text-left">
              <p className="text-sm font-medium text-white/90">
                Escaneie o QR Code ao lado ou copie o código abaixo para pagar no app do seu banco.
              </p>
              <button
                onClick={handleCopiarPix}
                className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold transition-all min-h-[44px]
                  ${copiado ? 'bg-white text-green-600' : 'bg-green-500 hover:bg-green-400 text-white'}`}
              >
                {copiado ? <CheckCircle2 size={20} /> : <Copy size={20} />}
                {copiado ? 'CÓDIGO COPIADO!' : 'COPIAR CÓDIGO PIX'}
              </button>
            </div>
          </div>
        </section>
      )}

      <div className="flex flex-col gap-6">
        
        {/* Itens */}
        <section className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-gray-100">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Package size={18} className="text-gray-400" />
              Itens do Pedido
            </h3>
          </div>
          <div className="divide-y divide-gray-100">
            {pedido.items.map(item => (
              <div key={item.id} className="p-4 sm:p-5 flex items-center gap-4">
                <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border border-gray-100 flex-shrink-0">
                  <Image src={item.imagemProduto} alt={item.nomeProduto} fill className="object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{item.nomeProduto}</p>
                  <p className="text-xs text-gray-500">{item.quantidade} × {formatarMoeda(item.preco)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{formatarMoeda(item.subtotal)}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-gray-50 p-5 sm:p-6 space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <span>{formatarMoeda(pedido.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Frete</span>
              <span>{pedido.frete === 0 ? 'Grátis' : formatarMoeda(pedido.frete)}</span>
            </div>
            <div className="flex justify-between text-lg font-black text-gray-900 pt-2 border-t border-gray-200 mt-2">
              <span>Total</span>
              <span className="text-green-600">{formatarMoeda(pedido.total)}</span>
            </div>
          </div>
        </section>

        {/* Informações Extras (Accordions em Mobile) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          
          {/* Pagamento */}
          <details className="group bg-white rounded-2xl border border-gray-100 overflow-hidden" open>
            <summary className="p-4 sm:p-5 flex items-center justify-between cursor-pointer list-none select-none min-h-[44px]">
              <h3 className="font-bold text-gray-900 flex items-center gap-2 text-sm uppercase tracking-wider text-gray-500">
                <CreditCard size={18} /> Pagamento
              </h3>
              <span className="transition group-open:rotate-180">
                <svg fill="none" height="24" shape-rendering="geometricPrecision" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
              </span>
            </summary>
            <div className="p-4 sm:p-5 pt-0 border-t border-gray-100 text-sm">
              <p className="font-bold text-gray-900">{pedido.metodoPagamento}</p>
              <p className="text-xs text-gray-500 mt-1">Processado via Mercado Pago</p>
            </div>
          </details>

          {/* Entrega */}
          <details className="group bg-white rounded-2xl border border-gray-100 overflow-hidden" open>
            <summary className="p-4 sm:p-5 flex items-center justify-between cursor-pointer list-none select-none min-h-[44px]">
              <h3 className="font-bold text-gray-900 flex items-center gap-2 text-sm uppercase tracking-wider text-gray-500">
                <MapPin size={18} /> Entrega
              </h3>
              <span className="transition group-open:rotate-180">
                <svg fill="none" height="24" shape-rendering="geometricPrecision" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
              </span>
            </summary>
            <div className="p-4 sm:p-5 pt-0 border-t border-gray-100 text-sm">
              {pedido.entregaTipo === 'RETIRADA' ? (
                <div>
                  <p className="font-bold text-gray-900">Retirada em Loja</p>
                  <p className="text-xs text-gray-500 mt-1">Aguarde o status "Liberado"</p>
                </div>
              ) : (
                <div className="text-gray-700 leading-relaxed">
                  <p className="font-bold text-gray-900">{pedido.endereco.logradouro}, {pedido.endereco.numero}</p>
                  <p>{pedido.endereco.bairro}</p>
                  <p>{pedido.endereco.cidade} - {pedido.endereco.uf}</p>
                  <p className="text-xs text-gray-500 mt-1">CEP: {pedido.endereco.cep}</p>
                </div>
              )}
            </div>
          </details>

        </div>

      </div>

    </div>
  );
}
