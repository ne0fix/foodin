'use client';

import { useState, useEffect } from 'react';
import { initMercadoPago, CardPayment } from '@mercadopago/sdk-react';
import { DadosComprador, DadosEntrega, CheckoutIniciarPayload } from '@/src/models/checkout.model';
import { ItemCarrinho } from '@/src/models/produto.model';
import { formatarMoeda } from '@/src/utils/formatadores';
import { Loader2, QrCode, CreditCard } from 'lucide-react';

interface Props {
  metodo: 'PIX' | 'CARTAO';
  comprador: DadosComprador;
  entrega: DadosEntrega;
  itens: ItemCarrinho[];
  subtotal: number;
  frete: number;
  onBack: () => void;
  onSuccess: (orderId: string) => void;
}

interface CardPaymentFormData {
  token: string;
  issuer_id: string | null;
  payment_method_id: string;
  transaction_amount: number;
  installments: number;
  payer: { email: string; identification: { type: string; number: string } };
}

export default function StepPagamento({
  metodo, comprador, entrega, itens, subtotal, frete, onBack, onSuccess,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [erro, setErro]       = useState('');
  const total = Math.round((subtotal + frete) * 100) / 100;

  useEffect(() => {
    initMercadoPago(process.env.NEXT_PUBLIC_MP_PUBLIC_KEY!, { locale: 'pt-BR' });
  }, []);

  const itensMp = itens.map(i => ({ produtoId: i.produto.id, quantidade: i.quantidade }));

  // ─── PIX ──────────────────────────────────────────────────────────────────
  const pagarPix = async () => {
    setLoading(true);
    setErro('');
    const payload: CheckoutIniciarPayload = {
      itens: itensMp, comprador, entrega, metodo: 'PIX', frete,
    };
    try {
      const res = await fetch('/api/checkout/iniciar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Erro ao gerar PIX');
      onSuccess(data.orderId);
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : 'Erro inesperado');
      setLoading(false);
    }
  };

  // ─── Cartão ───────────────────────────────────────────────────────────────
  const onCardSubmit = async (formData: CardPaymentFormData) => {
    setLoading(true);
    setErro('');
    const payload: CheckoutIniciarPayload = {
      itens: itensMp, comprador, entrega, metodo: 'CARTAO', frete,
      cardToken:       formData.token,
      parcelas:        formData.installments,
      issuerId:        formData.issuer_id ?? undefined,
      paymentMethodId: formData.payment_method_id,
    };
    try {
      const res = await fetch('/api/checkout/iniciar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Pagamento recusado');
      onSuccess(data.orderId);
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : 'Pagamento recusado. Tente novamente.');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Resumo */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <h2 className="text-xl font-extrabold text-gray-900 mb-4">Resumo do pedido</h2>
        <div className="text-sm">
          {/* Cabeçalho */}
          <div className="grid grid-cols-[1fr_auto_auto] gap-x-3 pb-2 border-b border-gray-100 text-[11px] font-bold uppercase tracking-wider text-gray-400">
            <span>Produto</span>
            <span className="text-center">Qtd</span>
            <span className="text-right">Subtotal</span>
          </div>

          {/* Itens */}
          <div className="divide-y divide-gray-50">
            {itens.map(i => (
              <div key={i.produto.id} className="grid grid-cols-[1fr_auto_auto] gap-x-3 items-center py-2">
                <span className="text-gray-700 leading-snug">{i.produto.nome}</span>
                <span className="text-xs font-semibold text-gray-400 text-center tabular-nums w-8">×{i.quantidade}</span>
                <span className="font-bold text-gray-900 text-right tabular-nums whitespace-nowrap">
                  {formatarMoeda(i.produto.preco * i.quantidade)}
                </span>
              </div>
            ))}
          </div>

          {/* Frete */}
          <div className="grid grid-cols-[1fr_auto] gap-x-3 items-center pt-2 mt-1 border-t border-gray-100">
            <span className="text-gray-600">Frete</span>
            <span className="font-bold text-right whitespace-nowrap">
              {frete === 0 ? <span className="text-green-600">Grátis</span> : formatarMoeda(frete)}
            </span>
          </div>

          {/* Total */}
          <div className="grid grid-cols-[1fr_auto] gap-x-3 items-center pt-2 mt-1 border-t border-gray-200 text-base font-extrabold text-gray-900">
            <span>Total</span>
            <span className="text-green-600 text-right whitespace-nowrap">{formatarMoeda(total)}</span>
          </div>
        </div>
      </div>

      {/* Pagamento */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
        <div className="flex items-center gap-2">
          {metodo === 'PIX'
            ? <><QrCode size={20} className="text-green-600" /><h2 className="text-xl font-extrabold text-gray-900">Pagamento via PIX</h2></>
            : <><CreditCard size={20} className="text-gray-700" /><h2 className="text-xl font-extrabold text-gray-900">Dados do cartão</h2></>
          }
        </div>

        {erro && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3">
            {erro}
          </div>
        )}

        {/* ─── PIX ───────────────────────────────────────────────────────── */}
        {metodo === 'PIX' && (
          <div className="space-y-3">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800 space-y-1">
              <p className="font-bold">Como funciona:</p>
              <ol className="list-decimal list-inside space-y-0.5">
                <li>Clique em "Gerar QR Code"</li>
                <li>Abra o app do seu banco → PIX → Copia e Cola</li>
                <li>Cole o código e confirme</li>
                <li>A confirmação é automática em segundos</li>
              </ol>
            </div>
            <button
              onClick={pagarPix}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2 text-base"
            >
              {loading
                ? <><Loader2 size={18} className="animate-spin" /> Gerando PIX...</>
                : `Gerar QR Code PIX — ${formatarMoeda(total)}`}
            </button>
          </div>
        )}

        {/* ─── Cartão ─────────────────────────────────────────────────────── */}
        {metodo === 'CARTAO' && (
          <div className="space-y-3">
            <p className="text-xs text-gray-500">
              Seus dados são processados com segurança pelo Mercado Pago.
              Nenhuma informação de cartão é armazenada em nossos servidores.
            </p>
            <CardPayment
              initialization={{
                amount: total,
                payer: {
                  email: comprador.email,
                  ...(comprador.cpf ? {
                    identification: { type: 'CPF', number: comprador.cpf },
                  } : {}),
                },
              }}
              onSubmit={async (formData) => {
                await onCardSubmit(formData as CardPaymentFormData);
              }}
              onError={(error) => setErro(`Erro no formulário: ${String(error)}`)}
            />
            {loading && (
              <div className="flex items-center justify-center gap-2 text-green-600 py-2">
                <Loader2 size={18} className="animate-spin" />
                <span className="text-sm font-medium">Processando pagamento...</span>
              </div>
            )}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onBack}
        disabled={loading}
        className="w-full border border-gray-300 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
      >
        ← Voltar
      </button>
    </div>
  );
}
