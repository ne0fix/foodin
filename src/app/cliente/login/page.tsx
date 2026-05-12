"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Mail, Lock, Loader2, CheckCircle, X, MessageCircle } from "lucide-react";
import { formatarCPF } from "@/src/utils/validators";

const WHATSAPP_LOJA = "5585981058342";

function ModalEsqueciPin({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-7 flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-gray-900">Esqueci meu PIN</h2>
            <p className="text-sm text-gray-500 mt-1">Precisamos verificar sua identidade</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 -mt-1 -mr-1">
            <X size={20} />
          </button>
        </div>

        <p className="text-sm text-gray-600 leading-relaxed">
          Para redefinir seu PIN, entre em contato com nossa equipe pelo WhatsApp. Informe seu <strong>nome completo</strong> e <strong>CPF cadastrado</strong> e faremos a verificação.
        </p>

        <a
          href={`https://wa.me/${WHATSAPP_LOJA}?text=${encodeURIComponent("Olá! Esqueci meu PIN e preciso de ajuda para recuperar o acesso à minha conta.")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2.5 bg-green-500 hover:bg-green-600 active:scale-[0.98] text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-green-500/30 text-[15px]"
        >
          <MessageCircle size={20} />
          Falar pelo WhatsApp
        </a>

        <button
          onClick={onClose}
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors text-center font-medium"
        >
          Voltar ao login
        </button>
      </div>
    </div>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect") || "/cliente";
  const redirect = decodeURIComponent(redirectParam);
  const sucesso = searchParams.get("sucesso") === "1";

  const [cpf, setCpf] = useState("");
  const [pin, setPin] = useState("");
  const [salvarAcesso, setSalvarAcesso] = useState(true);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [modalPinAberto, setModalPinAberto] = useState(false);

  useEffect(() => {
    if (pin.length === 4 && cpf.replace(/\D/g, "").length === 11 && !carregando) {
      handleLogin();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (carregando) return;
    setErro("");
    const cpfLimpo = cpf.replace(/\D/g, "");
    if (cpfLimpo.length !== 11) { setErro("CPF inválido"); return; }
    if (pin.length !== 4) { setErro("PIN deve ter 4 dígitos"); return; }
    setCarregando(true);
    try {
      const res = await fetch("/api/cliente/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cpf: cpfLimpo, pin }),
      });
      const data = await res.json();
      if (!res.ok) { setErro(data.error || "CPF ou PIN inválidos"); return; }
      router.push(redirect);
    } catch {
      setErro("Erro de conexão. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-green-700 via-green-700 to-green-900">
      {modalPinAberto && <ModalEsqueciPin onClose={() => setModalPinAberto(false)} />}

      {/* ── Área central: logo + card ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-10">

        {/* Card branco */}
        <div className="w-full max-w-[390px] bg-white rounded-3xl shadow-2xl overflow-hidden">

          {/* Cabeçalho do card */}
          <div className="px-7 pt-7 pb-5 flex justify-center">
            <Link href="/">
              <Image
                src="/foodin.png"
                alt="foodin"
                width={160}
                height={64}
                className="h-12 w-auto"
                priority
              />
            </Link>
          </div>

          {/* Corpo do card */}
          <div className="px-7 pb-7 flex flex-col space-y-4 w-full">

            {/* Toast de cadastro concluído */}
            {sucesso && (
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm font-semibold px-4 py-3 rounded-2xl">
                <CheckCircle size={16} className="flex-shrink-0" />
                Conta criada! Faça seu login.
              </div>
            )}

            {/* Campo CPF */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                CPF
              </label>
              <div className="flex items-center bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 gap-3 focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-500/15 transition-all">
                <Mail size={16} className="text-gray-400 flex-shrink-0" strokeWidth={2.5} />
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={14}
                  placeholder="000.000.000-00"
                  value={cpf}
                  onChange={e => { setCpf(formatarCPF(e.target.value)); setErro(""); }}
                  onBlur={() => {
                    if (cpf.replace(/\D/g, "").length === 11) {
                      (document.getElementById("pin-input") as HTMLInputElement)?.focus();
                    }
                  }}
                  autoComplete="off"
                  className="appearance-none flex-1 min-w-0 w-full bg-transparent outline-none focus:outline-none focus:ring-0 border-none p-0 text-sm font-semibold text-gray-800 placeholder:text-gray-300 placeholder:font-normal"
                />
              </div>
            </div>

            {/* Campo PIN */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                PIN de acesso
              </label>
              <div className="flex items-center bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 gap-3 focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-500/15 transition-all">
                <Lock size={16} className="text-gray-400 flex-shrink-0" strokeWidth={2.5} />
                <input
                  id="pin-input"
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="••••"
                  value={pin}
                  onChange={e => { setPin(e.target.value.replace(/\D/g, "").slice(0, 4)); setErro(""); }}
                  autoComplete="off"
                  className="appearance-none flex-1 min-w-0 w-full bg-transparent outline-none focus:outline-none focus:ring-0 border-none p-0 text-xl font-black text-gray-800 placeholder:text-gray-300 placeholder:font-normal placeholder:text-base tracking-[0.5em] [&::-ms-reveal]:hidden [&::-webkit-contacts-auto-fill-button]:hidden"
                />
                {/* Indicador de progresso */}
                <div className="flex gap-1.5 flex-shrink-0">
                  {[0, 1, 2, 3].map(i => (
                    <div key={i} className={`w-2 h-2 rounded-full transition-all duration-200 ${i < pin.length ? "bg-green-500 scale-110" : "bg-gray-200"}`} />
                  ))}
                </div>
              </div>
            </div>

            {/* Salvar acesso + Esqueci PIN */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <div className="relative w-4 h-4">
                  <input
                    type="checkbox"
                    checked={salvarAcesso}
                    onChange={e => setSalvarAcesso(e.target.checked)}
                    className="peer appearance-none w-4 h-4 rounded bg-gray-200 checked:bg-green-600 outline-none cursor-pointer transition-colors"
                  />
                  <svg className="absolute inset-0 w-full h-full text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity p-0.5"
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-gray-600">Salvar acesso</span>
              </label>
              <button type="button" onClick={() => setModalPinAberto(true)} className="text-xs font-semibold text-green-600 hover:text-green-700 hover:underline transition-colors">
                Esqueci meu PIN
              </button>
            </div>

            {/* Erro */}
            <div className="min-h-[48px] w-full flex items-center justify-center -my-1">
              {erro && (
                <div className="w-full bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl text-sm font-semibold text-center animate-in fade-in duration-200">
                  {erro}
                </div>
              )}
            </div>

            {/* Botão principal */}
            <button
              type="button"
              onClick={() => handleLogin()}
              disabled={carregando}
              className="w-full bg-green-600 hover:bg-green-700 active:scale-[0.98] disabled:opacity-60
                text-white font-bold py-4 rounded-2xl transition-all duration-200 mt-1
                shadow-lg shadow-green-600/30 flex items-center justify-center gap-2 text-[15px]"
            >
              {carregando
                ? <><Loader2 size={18} className="animate-spin" /> Entrando...</>
                : "Entrar na conta"}
            </button>

            {/* Não tem uma conta? */}
            <div className="flex flex-col items-center gap-1 pt-1">
              <p className="text-gray-400 text-sm">Não tem uma conta?</p>
              <Link
                href="/cadastro"
                className="text-green-600 font-black text-base hover:underline underline-offset-2 tracking-wide transition-colors"
              >
                Criar Conta
              </Link>
            </div>

          </div>
        </div>
      </div>

    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-green-800">
        <Loader2 className="animate-spin text-white" size={36} />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
