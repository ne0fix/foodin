'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Clock, XCircle, Copy, Check } from 'lucide-react';
import { formatarMoeda } from '@/src/utils/formatadores';

interface PedidoStatus {
  orderId: string;
  status: 'PENDING_PAYMENT' | 'PROCESSING' | 'PAID' | 'FAILED' | 'CANCELLED';
  total: number;
  metodo: 'PIX' | 'CARTAO';
  qrCode?: string;
  qrCodeBase64?: string;
}

const POLLING_INTERVAL = 3000;   // 3 segundos
const POLLING_TIMEOUT = 30 * 60 * 1000; // 30 minutos

export default function PedidoPage() {
  const { id } = useParams<{ id: string }>();
  const [pedido, setPedido] = useState<PedidoStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiado, setCopiado] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(Date.now());

  const fetchStatus = async () => {
    const res = await fetch(`/api/checkout/status/${id}`);
    if (!res.ok) return;
    const data: PedidoStatus = await res.json();
    setPedido(data);
    setLoading(false);

    // Parar polling se finalizado ou timeout
    if (['PAID', 'FAILED', 'CANCELLED'].includes(data.status)) {
      if (pollingRef.current) clearInterval(pollingRef.current);
    }
    if (Date.now() - startTimeRef.current > POLLING_TIMEOUT) {
      if (pollingRef.current) clearInterval(pollingRef.current);
    }
  };

  useEffect(() => {
    fetchStatus();
    pollingRef.current = setInterval(fetchStatus, POLLING_INTERVAL);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [id]);

  const copiarPix = async () => {
    if (!pedido?.qrCode) return;
    await navigator.clipboard.writeText(pedido.qrCode);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!pedido) {
    return (
      <div className="container mx-auto px-4 max-w-lg py-16 text-center">
        <p className="text-gray-500">Pedido não encontrado.</p>
        <Link href="/" className="text-green-600 font-bold mt-4 block">Voltar ao início</Link>
      </div>
    );
  }

  // ─── PAGO ────────────────────────────────────────────────────────────────
  if (pedido.status === 'PAID') {
    return (
      <div className="container mx-auto px-4 max-w-lg py-16 text-center">
        <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Pagamento confirmado!</h1>
        <p className="text-gray-500 mb-2">Pedido <span className="font-bold">#{id.slice(-8).toUpperCase()}</span></p>
        <p className="text-2xl font-black text-green-600 mb-8">{formatarMoeda(pedido.total)}</p>
        <Link href="/cliente/pedidos" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full transition-colors mb-4 block w-fit mx-auto">
          Ir para meus pedidos
        </Link>
        <Link href="/produtos" className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-full transition-colors block w-fit mx-auto">
          Continuar comprando
        </Link>
      </div>
    );
  }

  // ─── FALHA ───────────────────────────────────────────────────────────────
  if (pedido.status === 'FAILED' || pedido.status === 'CANCELLED') {
    return (
      <div className="container mx-auto px-4 max-w-lg py-16 text-center">
        <XCircle size={64} className="text-red-400 mx-auto mb-4" />
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Pagamento não aprovado</h1>
        <p className="text-gray-500 mb-8">Verifique os dados e tente novamente.</p>
        <Link href="/checkout" className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-full transition-colors">
          Tentar novamente
        </Link>
      </div>
    );
  }

  // ─── AGUARDANDO PIX ──────────────────────────────────────────────────────
  // Mostra QR Code se for PIX, tiver o código e o pagamento não foi concluído.
  // PROCESSING também é válido — o webhook do MP pode atualizar antes do cliente ver o QR.
  if (pedido.metodo === 'PIX' && pedido.qrCode &&
      (pedido.status === 'PENDING_PAYMENT' || pedido.status === 'PROCESSING')) {
    return (
      <div className="container mx-auto px-4 max-w-lg py-8">
        <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center space-y-5">
          <div className="flex items-center justify-center gap-2 text-amber-600">
            <Clock size={20} className="animate-pulse" />
            <span className="font-bold">Aguardando pagamento</span>
          </div>
          <h1 className="text-xl font-extrabold text-gray-900">
            Pedido <span className="text-green-600">#{id.slice(-8).toUpperCase()}</span>
          </h1>
          <p className="text-2xl font-black text-green-600">{formatarMoeda(pedido.total)}</p>

          {pedido.qrCodeBase64 && (
            <div className="flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`data:image/png;base64,${pedido.qrCodeBase64}`}
                alt="QR Code PIX"
                width={200}
                height={200}
                className="rounded-xl border border-gray-200"
              />
            </div>
          )}

          {pedido.qrCode && (
            <button
              onClick={copiarPix}
              className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 rounded-xl transition-colors"
            >
              {copiado ? <><Check size={16} className="text-green-600" /> Copiado!</> : <><Copy size={16} /> Copiar código PIX</>}
            </button>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800">
            Abra o app do seu banco → PIX → Copia e Cola → Cole o código acima.
            <br />Esta página atualiza automaticamente.
          </div>
        </div>
      </div>
    );
  }

  // ─── PROCESSING / fallback ────────────────────────────────────────────────
  return (
    <div className="container mx-auto px-4 max-w-lg py-16 text-center">
      <div className="animate-spin w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full mx-auto mb-4" />
      <p className="text-gray-600 font-medium">Confirmando pagamento...</p>
    </div>
  );
}
