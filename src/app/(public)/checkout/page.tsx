'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCarrinhoViewModel } from '@/src/viewmodels/carrinho.vm';
import { DadosComprador, DadosEntrega } from '@/src/models/checkout.model';
import StepDados from './StepDados';
import StepEntrega from './StepEntrega';
import StepPagamento from './StepPagamento';
import { ChevronRight } from 'lucide-react';

export type CheckoutStep = 1 | 2 | 3;

export default function CheckoutPage() {
  const router = useRouter();
  const { itens, subtotal, limparCarrinho } = useCarrinhoViewModel();
  const [step, setStep] = useState<CheckoutStep>(1);
  const [comprador, setComprador] = useState<DadosComprador | null>(null);
  const [entrega, setEntrega] = useState<DadosEntrega | null>(null);
  const [frete, setFrete] = useState(0);
  // Aguarda a hidratação do localStorage antes de verificar o carrinho.
  // Sem isso, itens=[]] no primeiro render redireciona antes do carrinho carregar.
  const [hidratado, setHidratado] = useState(false);

  useEffect(() => { setHidratado(true); }, []);

  useEffect(() => {
    if (hidratado && itens.length === 0) router.replace('/carrinho');
  }, [hidratado, itens.length, router]);

  // Mostra spinner enquanto o localStorage ainda não foi lido
  if (!hidratado) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (itens.length === 0) return null;

  const STEPS = [
    { num: 1, label: 'Seus dados' },
    { num: 2, label: 'Entrega' },
    { num: 3, label: 'Pagamento' },
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
                ${step > s.num ? 'bg-green-600 border-green-600 text-white' : ''}
                ${step === s.num ? 'border-green-600 text-green-600' : ''}
                ${step < s.num ? 'border-gray-300 text-gray-400' : ''}
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

      {/* Steps */}
      {step === 1 && (
        <StepDados
          inicial={comprador}
          onNext={(dados) => { setComprador(dados); setStep(2); }}
        />
      )}
      {step === 2 && (
        <StepEntrega
          subtotal={subtotal}
          inicial={entrega}
          onBack={() => setStep(1)}
          onNext={(dados, freteCalculado) => {
            setEntrega(dados);
            setFrete(freteCalculado);
            setStep(3);
          }}
        />
      )}
      {step === 3 && comprador && entrega && (
        <StepPagamento
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
