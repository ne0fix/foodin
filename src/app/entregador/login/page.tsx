'use client';
import { useState } from 'react';
import Image from 'next/image';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

function formatarTelefone(valor: string) {
  const d = valor.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0,2)}) ${d.slice(2)}`;
  return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
}

export default function EntregadorLoginPage() {
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErro('');

    const res = await fetch('/api/entregador/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telefone: telefone.replace(/\D/g, ''), senha }),
    });

    if (res.ok) {
      window.location.href = '/entregador';
    } else {
      const data = await res.json().catch(() => ({}));
      setErro(data.error ?? 'Telefone ou senha inválidos');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-white via-green-50 to-green-100">
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-10">

        {/* Card */}
        <div className="w-full max-w-[390px] bg-white rounded-3xl shadow-2xl overflow-hidden">

          {/* Cabeçalho */}
          <div className="bg-white px-8 pt-8 pb-6 flex flex-col items-center gap-3 border-b border-gray-100">
            <Image src="/foodin.png" alt="FoodIN" width={150} height={72} className="drop-shadow-sm h-auto w-auto" priority />
            <p className="text-gray-400 text-sm font-semibold tracking-wide">Área do Entregador</p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="px-7 py-6 space-y-4">

            {/* Telefone */}
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
                Telefone
              </label>
              <div className="flex items-center bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 gap-3 focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-500/15 transition-all">
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  value={telefone}
                  onChange={e => { setTelefone(formatarTelefone(e.target.value)); setErro(''); }}
                  placeholder="(85) 99999-9999"
                  required
                  className="flex-1 bg-transparent outline-none text-gray-900 placeholder-gray-400 text-sm"
                />
              </div>
            </div>

            {/* Senha */}
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
                Senha
              </label>
              <div className="flex items-center bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 gap-3 focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-500/15 transition-all">
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  value={senha}
                  onChange={e => { setSenha(e.target.value); setErro(''); }}
                  placeholder="••••••••"
                  required
                  className="flex-1 bg-transparent outline-none text-gray-900 placeholder-gray-400 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(v => !v)}
                  className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                >
                  {mostrarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Erro */}
            {erro && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl text-sm font-semibold text-center">
                {erro}
              </div>
            )}

            {/* Botão */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 active:scale-[0.98] disabled:opacity-60 text-white font-bold py-4 rounded-2xl transition-all duration-200 mt-1 flex items-center justify-center gap-2 shadow-lg shadow-green-600/20"
            >
              {loading ? <><Loader2 size={18} className="animate-spin" /> Entrando...</> : 'Entrar'}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
}
