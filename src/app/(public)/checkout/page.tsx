'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCarrinhoViewModel } from '@/src/viewmodels/carrinho.vm';
import { DadosComprador, DadosEntrega } from '@/src/models/checkout.model';
import StepMetodo from './StepMetodo';
import StepDados from './StepDados';
import StepPagamento from './StepPagamento';
import { ChevronRight } from 'lucide-react';

type Metodo = 'PIX' | 'CARTAO';
export type CheckoutStep = 1 | 2 | 3;

export default function CheckoutPage() {
  const router = useRouter();
  const { itens, subtotal, limparCarrinho } = useCarrinhoViewModel();
  const [hidratado, setHidratado] = useState(false);

  const [step, setStep]         = useState<CheckoutStep>(1);
  const [metodo, setMetodo]     = useState<Metodo | null>(null);
  const [comprador, setComprador] = useState<DadosComprador | null>(null);
  const [entrega, setEntrega]   = useState<DadosEntrega | null>(null);
  const [frete, setFrete]       = useState(0);

  useEffect(() => { setHidratado(true); }, []);

  useEffect(() => {
    if (hidratado && itens.length === 0) router.replace('/carrinho');
  }, [hidratado, itens.length, router]);

  if (!hidratado) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (itens.length === 0) return null;

  const STEPS = [
    { num: 1, label: 'Pagamento' },
    { num: 2, label: 'Seus dados' },
    { num: 3, label: 'Confirmar'  },
  ];

  return (
    <div className="container mx-auto px-4 max-w-3xl py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-6">
        <a href="/" className="hover:text-green-600">Início</a>
        <ChevronRight size={12} />
        <a href="/carrinho" className="hover:text-green-600">Carrinho</a>
        <ChevronRight size={12} />
        <span className="font-medium text-gray-900">Checkout</span>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {STEPS.map((s, idx) => (
          <div key={s.num} className="flex items-center gap-2">
            <div className={`flex items-center gap-2 ${step >= s.num ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2
                ${step > s.num  ? 'bg-green-600 border-green-600 text-white' : ''}
                ${step === s.num ? 'border-green-600 text-green-600' : ''}
                ${step < s.num  ? 'border-gray-300 text-gray-400' : ''}
              `}>
                {step > s.num ? '✓' : s.num}
              </div>
              <span className="text-sm font-medium hidden sm:inline">{s.label}</span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={`h-px w-8 sm:w-16 ${step > s.num ? 'bg-green-600' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Passo 1 — Escolher método */}
      {step === 1 && (
        <StepMetodo
          onNext={(m) => { setMetodo(m); setStep(2); }}
        />
      )}

      {/* Passo 2 — Dados + Entrega */}
      {step === 2 && metodo && (
        <StepDados
          metodo={metodo}
          subtotal={subtotal}
          inicialComprador={comprador}
          inicialEntrega={entrega}
          inicialFrete={frete}
          onBack={() => setStep(1)}
          onNext={(c, e, f) => {
            setComprador(c);
            setEntrega(e);
            setFrete(f);
            setStep(3);
          }}
        />
      )}

      {/* Passo 3 — Pagamento */}
      {step === 3 && metodo && comprador && entrega && (
        <StepPagamento
          metodo={metodo}
          comprador={comprador}
          entrega={entrega}
          itens={itens}
          subtotal={subtotal}
          frete={frete}
          onBack={() => setStep(2)}
          onSuccess={(orderId) => {
            limparCarrinho();
            router.push(`/pedido/${orderId}`);
          }}
        />
      )}
    </div>
  );
}
