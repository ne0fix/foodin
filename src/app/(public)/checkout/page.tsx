'use client';

import { useState, useEffect, useRef } from 'react';
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
  const { itens, subtotal, limparCarrinho, refreshPrecos } = useCarrinhoViewModel();
  const [hidratado, setHidratado] = useState(false);
  // Impede redirect para /carrinho quando o pedido foi finalizado com sucesso
  const finalizando = useRef(false);

  const [step, setStep]           = useState<CheckoutStep>(1);
  const [metodo, setMetodo]       = useState<Metodo | null>(null);
  const [comprador, setComprador] = useState<DadosComprador | null>(null);
  const [entrega, setEntrega]     = useState<DadosEntrega | null>(null);
  const [frete, setFrete]         = useState(0);
  
  const [clienteLogado, setClienteLogado] = useState<any>(null);

  useEffect(() => { setHidratado(true); }, []);

  useEffect(() => {
    if (!hidratado) return;
    if (itens.length === 0 && !finalizando.current) {
      router.replace('/carrinho');
      return;
    }
    // Atualiza preços do localStorage com os valores atuais da API
    refreshPrecos();

    // Verificar se há cliente logado
    fetch('/api/cliente/me')
      .then(r => {
        if (r.status === 401) {
          router.replace('/cliente/login?redirect=/checkout');
          return null;
        }
        return r.ok ? r.json() : null;
      })
      .then(data => {
        if (data && data.id) {
          setClienteLogado(data);
          // Pré-preencher comprador
          setComprador({
            nome: data.nome,
            email: `${data.cpf}@ekomart.com.br`, // Email fake ou real se houver
            telefone: data.whatsapp,
            cpf: data.cpf
          });
          // Se tiver endereço principal, pré-preencher entrega
          const principal = data.enderecos.find((e: any) => e.principal) || data.enderecos[0];
          if (principal) {
            setEntrega({
              tipo: 'ENTREGA',
              cep: principal.cep,
              logradouro: principal.logradouro,
              numero: principal.numero,
              complemento: principal.complemento,
              bairro: principal.bairro,
              cidade: principal.cidade,
              uf: principal.uf
            });
            // Buscar frete para o endereço principal
            fetch(`/api/frete/calcular?cep=${principal.cep}&subtotal=${subtotal}`)
              .then(r => r.json())
              .then(f => setFrete(f.frete))
              .catch(() => {});
          }
        } else if (data === null) {
          // Se não houver dados e não foi redirecionado no catch
          // (mas a API costuma retornar 401 que é tratado acima)
        } else {
          router.replace('/cliente/login?redirect=/checkout');
        }
      })
      .catch(() => {
        router.replace('/cliente/login?redirect=/checkout');
      });
  }, [hidratado]); // eslint-disable-line react-hooks/exhaustive-deps

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
            finalizando.current = true; // bloqueia redirect para /carrinho
            limparCarrinho();
            router.push(`/pedido/${orderId}`);
          }}
        />
      )}
    </div>
  );
}
