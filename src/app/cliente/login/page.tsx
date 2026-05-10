'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { PinInput } from '@/src/components/ui/PinInput';
import { formatarCPF } from '@/src/utils/validators';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/cliente';
  const sucesso = searchParams.get('sucesso') === '1';

  const [cpf, setCpf] = useState('');
  const [pin, setPin] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  // Auto-foco no PIN quando o CPF estiver completo
  useEffect(() => {
    if (cpf.replace(/\D/g, '').length === 11) {
      setTimeout(() => {
        const pinInput = document.querySelector('input[type="password"]');
        (pinInput as HTMLInputElement)?.focus();
      }, 100);
    }
  }, [cpf]);

  // Auto-submit quando o PIN estiver completo (4 dígitos + CPF válido)
  useEffect(() => {
    if (pin.length === 4 && cpf.replace(/\D/g, '').length === 11 && !carregando) {
      handleLogin();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (carregando) return;
    setErro('');

    const cpfLimpo = cpf.replace(/\D/g, '');
    if (cpfLimpo.length !== 11) return setErro('CPF inválido');
    if (pin.length !== 4) return setErro('PIN deve ter 4 dígitos');

    setCarregando(true);

    try {
      const res = await fetch('/api/cliente/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpf: cpfLimpo, pin }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErro(data.error || 'CPF ou PIN inválidos');
        return;
      }

      router.push(redirect);

    } catch (err) {
      setErro('Erro de conexão. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Link href="/">
            <Image src="/gn2.png" alt="Ekomart" width={200} height={100} priority className="h-20 w-auto" />
          </Link>
        </div>

        <h2 className="text-center text-3xl font-extrabold text-gray-900 mb-2">
          Bem-vindo de volta!
        </h2>
        <p className="text-center text-sm text-gray-600 mb-8">
          Acesse sua conta para ver seus pedidos e gerenciar seu perfil.
        </p>

        {/* Mensagem de Sucesso */}
        {sucesso && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-500">
            <CheckCircle2 className="text-green-600 flex-shrink-0" size={24} />
            <div>
              <p className="text-sm font-bold text-green-800">Cadastro realizado!</p>
              <p className="text-xs text-green-700">Agora você já pode fazer seu primeiro login.</p>
            </div>
          </div>
        )}

        <div className="bg-white py-8 px-4 shadow-sm border border-gray-200 sm:rounded-2xl sm:px-10">
          <form className="space-y-6" onSubmit={handleLogin}>
            
            <div>
              <label htmlFor="cpf" className="block text-sm font-bold text-gray-700 mb-2">
                Seu CPF
              </label>
              <input
                id="cpf"
                name="cpf"
                type="text"
                inputMode="numeric"
                maxLength={14}
                required
                value={cpf}
                onChange={e => setCpf(formatarCPF(e.target.value))}
                className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 text-lg transition-colors"
                placeholder="000.000.000-00"
              />
            </div>

            <div>
              <PinInput
                label="Seu PIN de 4 dígitos"
                value={pin}
                onChange={setPin}
                erro={erro.includes('PIN') ? erro : ''}
              />
            </div>

            {erro && !erro.includes('PIN') && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-medium">
                {erro}
              </div>
            )}

            <div>
              <button
                disabled={carregando}
                type="submit"
                className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-md text-base font-bold text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 transition-all active:scale-[0.98]"
              >
                {carregando ? <Loader2 className="animate-spin" size={20} /> : 'ENTRAR'}
              </button>
            </div>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              Não tem conta? <Link href="/cadastro" className="text-green-600 font-bold hover:underline">Cadastre-se agora</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-green-600" size={40} />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
