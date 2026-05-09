'use client';

import { useState, useEffect } from 'react';
import { initMercadoPago, CardPayment } from '@mercadopago/sdk-react';
import { DadosComprador, DadosEntrega, CheckoutIniciarPayload } from '@/src/models/checkout.model';
import { ItemCarrinho } from '@/src/models/produto.model';
import { formatarMoeda } from '@/src/utils/formatadores';
import { Loader2, QrCode, CreditCard } from 'lucide-react';

interface Props {
  comprador: DadosComprador;
  entrega: DadosEntrega;
  itens: ItemCarrinho[];
  subtotal: number;
  frete: number;
  onBack: () => void;
  onSuccess: (orderId: string) => void;
}

type Metodo = 'PIX' | 'CARTAO';

// Estrutura que o CardPayment Brick entrega no onSubmit
interface CardPaymentFormData {
  token: string;
  issuer_id: string | null;
  payment_method_id: string;      // "visa", "master", "amex", etc.
  transaction_amount: number;
  installments: number;
  payer: {
    email: string;
    identification: { type: string; number: string };
  };
}

export default function StepPagamento({
  comprador, entrega, itens, subtotal, frete, onBack, onSuccess,
}: Props) {
  const [metodo, setMetodo] = useState<Metodo>('PIX');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  // Arredonda para evitar rejeição do MP por decimais flutuantes
  const total = Math.round((subtotal + frete) * 100) / 100;

  useEffect(() => {
    initMercadoPago(process.env.NEXT_PUBLIC_MP_PUBLIC_KEY!, { locale: 'pt-BR' });
  }, []);

  // ─── PIX ──────────────────────────────────────────────────────────────────
  const pagarPix = async () => {
    setLoading(true);
    setErro('');
    const payload: CheckoutIniciarPayload = {
      itens: itens.map(i => ({ produtoId: i.produto.id, quantidade: i.quantidade })),
      comprador,
      entrega,
      metodo: 'PIX',
      frete,
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

  // ─── Cartão — recebe dados completos do CardPayment Brick ─────────────────
  const onCardSubmit = async (formData: CardPaymentFormData) => {
    setLoading(true);
    setErro('');
    const payload: CheckoutIniciarPayload = {
      itens: itens.map(i => ({ produtoId: i.produto.id, quantidade: i.quantidade })),
      comprador,
      entrega,
      metodo: 'CARTAO',
      frete,
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

      {/* Resumo do pedido */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <h2 className="text-xl font-extrabold text-gray-900 mb-4">Resumo</h2>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="font-bold text-gray-900">{formatarMoeda(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Frete</span>
            <span className="font-bold">
              {frete === 0
                ? <span className="text-green-600">Grátis</span>
                : formatarMoeda(frete)}
            </span>
          </div>
          <div className="flex justify-between text-base font-extrabold text-gray-900 border-t pt-2 mt-2">
            <span>Total</span>
            <span className="text-green-600">{formatarMoeda(total)}</span>
          </div>
        </div>
      </div>

      {/* Seleção de método */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
        <h2 className="text-xl font-extrabold text-gray-900">Pagamento</h2>

        <div className="grid grid-cols-2 gap-3">
          {(['PIX', 'CARTAO'] as const).map(m => (
            <button
              key={m}
              type="button"
              onClick={() => { setMetodo(m); setErro(''); }}
              className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 font-bold text-sm transition-colors
                ${metodo === m
                  ? 'border-green-600 bg-green-50 text-green-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
            >
              {m === 'PIX' ? <QrCode size={18} /> : <CreditCard size={18} />}
              {m === 'PIX' ? 'PIX' : 'Cartão de crédito'}
            </button>
          ))}
        </div>

        {erro && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3">
            {erro}
          </div>
        )}

        {/* ─── PIX ──────────────────────────────────────────────────────── */}
        {metodo === 'PIX' && (
          <div className="space-y-3">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800 space-y-1">
              <p className="font-bold">Como funciona o PIX:</p>
              <ol className="list-decimal list-inside space-y-0.5">
                <li>Clique em &quot;Gerar QR Code&quot;</li>
                <li>Abra o app do seu banco → PIX → Copia e Cola</li>
                <li>Cole o código e confirme o pagamento</li>
                <li>Aguarde a confirmação (automática, até 30 min)</li>
              </ol>
            </div>
            <button
              onClick={pagarPix}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {loading
                ? <><Loader2 size={18} className="animate-spin" /> Gerando PIX...</>
                : `Gerar QR Code PIX — ${formatarMoeda(total)}`}
            </button>
          </div>
        )}

        {/* ─── Cartão — CardPayment Brick (checkout transparente MP) ──── */}
        {metodo === 'CARTAO' && (
          <div className="space-y-3">
            <p className="text-xs text-gray-500">
              Seus dados de cartão são processados com segurança pelo Mercado Pago.
              Nenhuma informação é armazenada em nossos servidores.
            </p>
            {/*
              initialization.payer pré-preenche email e CPF já coletados no passo 1,
              evitando que o cliente os informe novamente.
            */}
            <CardPayment
              initialization={{
                amount: total,
                payer: {
                  email: comprador.email,
                  identification: {
                    type: 'CPF',
                    number: comprador.cpf,
                  },
                },
              }}
              onSubmit={async (formData) => {
                await onCardSubmit(formData as CardPaymentFormData);
              }}
              onError={(error) => {
                setErro(`Erro no formulário de cartão: ${String(error)}`);
              }}
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
