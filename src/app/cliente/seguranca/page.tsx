'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Lock, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { PinInput } from '@/src/components/ui/PinInput';

export default function SegurancaPage() {
  const router = useRouter();
  const [pinAtual, setPinAtual] = useState('');
  const [pinNovo, setPinNovo] = useState('');
  const [pinNovoConfirmacao, setPinNovoConfirmacao] = useState('');

  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setSucesso(false);

    if (pinAtual.length !== 4) return setErro('Informe seu PIN atual');
    if (pinNovo.length !== 4) return setErro('O novo PIN deve ter 4 dígitos');
    if (pinNovo !== pinNovoConfirmacao) return setErro('Os novos PINs não coincidem');
    if (pinNovo === pinAtual) return setErro('O novo PIN deve ser diferente do atual');

    setCarregando(true);

    try {
      const res = await fetch('/api/cliente/pin', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinAtual, pinNovo, pinNovoConfirmacao }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErro(data.error || 'Erro ao atualizar PIN');
        return;
      }

      setSucesso(true);
      setPinAtual('');
      setPinNovo('');
      setPinNovoConfirmacao('');

      // Redirect após 2 segundos
      setTimeout(() => router.push('/cliente'), 2000);

    } catch (err) {
      setErro('Erro de conexão. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="space-y-6">

      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-gray-900">Segurança da Conta</h1>
        <p className="text-sm text-gray-500">Mantenha sua conta protegida trocando seu PIN regularmente.</p>
      </div>

      <section className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <Lock size={20} />
          </div>
          <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider">Alterar PIN de Acesso</h3>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-6">

          <div className="space-y-4">
            <PinInput
              label="PIN Atual"
              value={pinAtual}
              onChange={setPinAtual}
            />
            <p className="text-xs text-gray-400">Informe o PIN que você usa atualmente para entrar.</p>
          </div>

          <div className="h-px bg-gray-100" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-4">
              <PinInput
                label="Novo PIN (4 dígitos)"
                value={pinNovo}
                onChange={setPinNovo}
              />
            </div>
            <div className="space-y-4">
              <PinInput
                label="Confirme o Novo PIN"
                value={pinNovoConfirmacao}
                onChange={setPinNovoConfirmacao}
              />
            </div>
          </div>

          {erro && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2">
              <AlertCircle size={18} />
              {erro}
            </div>
          )}

          {sucesso && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2 animate-in zoom-in-95 duration-300">
              <CheckCircle2 size={18} />
              PIN atualizado com sucesso! Redirecionando...
            </div>
          )}

          <button
            disabled={carregando || sucesso}
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-3 sm:py-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
          >
            {carregando ? <Loader2 className="animate-spin" size={20} /> : 'ATUALIZAR MEU PIN'}
          </button>

          <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-xl flex items-start gap-3">
            <ShieldCheck className="text-yellow-600 flex-shrink-0" size={20} />
            <p className="text-xs text-yellow-800 leading-relaxed">
              <strong>Importante:</strong> Ao trocar seu PIN, você continuará logado nesta sessão, mas precisará usar o novo PIN em seus próximos acessos em outros dispositivos.
            </p>
          </div>

        </form>
      </section>

    </div>
  );
}
