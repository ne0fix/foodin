"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Mail, Lock, Loader2 } from "lucide-react";
import { formatarCPF } from "@/src/utils/validators";

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

  // Auto-submit ao completar o PIN
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
    <main className="min-h-screen flex items-center justify-center bg-gray-200/50 sm:p-6 lg:p-8">

      {/* ── Frame mobile idêntico ao clone ── */}
      <div className="relative w-full h-[100dvh] sm:h-auto sm:max-w-[400px] bg-[#FBFDFF] sm:rounded-[36px] shadow-2xl overflow-hidden flex flex-col">

        {/* ── Conteúdo centralizado: logo + card ── */}
        <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-6 pb-20 pt-8">

          {/* Logo do projeto */}
          <Link href="/" className="mb-8">
            <Image src="/gn2.png" alt="Ekomart" width={180} height={72} className="h-14 w-auto" />
          </Link>

          {/* ── Card de login — estrutura idêntica ao clone ── */}
          <div className="w-full bg-[#FAFBFC] rounded-3xl p-6 shadow-[0_12px_44px_-12px_rgba(0,0,0,0.15)] relative z-20 mt-2">
            <h2 className="text-[22px] font-bold text-center text-[#1A1A1A] mb-6">
              Entrar na conta
            </h2>

            {/* Toast de sucesso de cadastro */}
            {sucesso && (
              <div className="mb-4 bg-green-50 border border-green-200 text-green-700 text-xs font-bold px-3 py-2 rounded-xl text-center">
                ✅ Conta criada! Faça seu login.
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">

              {/* Campo CPF — mesmo estilo do email input do clone */}
              <div className="flex items-center bg-white border border-gray-100 rounded-xl px-4 py-3.5 shadow-sm focus-within:shadow-md transition-shadow">
                <Mail size={16} className="text-[#0D0D0D] mr-3 flex-shrink-0" strokeWidth={3} />
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={14}
                  placeholder="CPF (000.000.000-00)"
                  value={cpf}
                  onChange={e => { setCpf(formatarCPF(e.target.value)); setErro(""); }}
                  onBlur={() => {
                    if (cpf.replace(/\D/g, "").length === 11) {
                      (document.getElementById("pin-input") as HTMLInputElement)?.focus();
                    }
                  }}
                  autoComplete="off"
                  className="flex-1 bg-transparent border-none outline-none text-[13px] font-bold text-gray-800 placeholder:text-gray-500 placeholder:font-normal"
                />
              </div>

              {/* Campo PIN — mesmo estilo do password input do clone */}
              <div className="flex items-center bg-white border border-gray-100 rounded-xl px-4 py-3.5 shadow-sm focus-within:shadow-md transition-shadow">
                <Lock size={16} className="text-[#0D0D0D] mr-3 flex-shrink-0" strokeWidth={3} />
                <input
                  id="pin-input"
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="PIN de 4 dígitos"
                  value={pin}
                  onChange={e => { setPin(e.target.value.replace(/\D/g, "").slice(0, 4)); setErro(""); }}
                  autoComplete="off"
                  className="flex-1 bg-transparent border-none outline-none text-[13px] font-bold text-gray-800 placeholder:text-gray-500 placeholder:font-normal tracking-[0.4em]"
                />
                {/* Indicador de progresso do PIN */}
                <div className="flex gap-1 ml-2">
                  {[0, 1, 2, 3].map(i => (
                    <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i < pin.length ? "bg-green-600" : "bg-gray-300"}`} />
                  ))}
                </div>
              </div>

              {/* Linha: Salvar acesso + Esqueci meu PIN — idêntico ao clone */}
              <div className="flex items-center justify-between pt-1 pb-1">
                <label className="flex items-center cursor-pointer group">
                  <div className="relative flex items-center justify-center w-4 h-4 mr-2">
                    <input
                      type="checkbox"
                      checked={salvarAcesso}
                      onChange={e => setSalvarAcesso(e.target.checked)}
                      // Checkbox azul → verde do projeto
                      className="peer appearance-none w-4 h-4 rounded bg-green-500 checked:bg-green-600 outline-none cursor-pointer"
                    />
                    <svg
                      className="absolute w-2.5 h-2.5 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity"
                      viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <span className="text-[11px] font-bold text-[#1A1A1A] select-none">
                    Salvar acesso
                  </span>
                </label>

                <button type="button" className="text-[11px] font-bold text-[#1A1A1A] hover:underline">
                  Esqueci meu PIN
                </button>
              </div>

              {/* Erro */}
              {erro && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-xl text-xs font-bold text-center">
                  {erro}
                </div>
              )}

              {/* Botão principal — azul original → verde do projeto */}
              <button
                type="submit"
                disabled={carregando}
                className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 active:scale-[0.98]
                  transition-all text-white text-[15px] font-bold py-4 rounded-xl mt-2 mb-2
                  shadow-[0_8px_20px_-8px_rgba(22,163,74,0.7)]
                  flex items-center justify-center gap-2"
              >
                {carregando
                  ? <><Loader2 size={18} className="animate-spin" /> Entrando...</>
                  : "Entrar na conta"}
              </button>
            </form>

            {/* "Or. Login with" — texto idêntico ao clone */}
            <div className="text-center mt-6 mb-3">
              <span className="text-[11px] font-bold text-gray-800/80">
                Ou. Acesse com
              </span>
            </div>

            {/* Três botões circulares — estrutura idêntica, cores adaptadas */}
            <div className="flex justify-center items-center gap-3 mt-4 mb-2">
              {/* A — amarelo mantido (igual ao clone) */}
              <Link href="/produtos" type="button"
                className="w-12 h-12 bg-[#F9B94F] flex items-center justify-center rounded-full text-white font-bold text-lg hover:opacity-90 transition-opacity shadow-sm">
                A
              </Link>
              {/* B — azul original → verde do projeto */}
              <Link href="/carrinho" type="button"
                className="w-12 h-12 bg-green-600 flex items-center justify-center rounded-full text-white font-bold text-lg hover:opacity-90 transition-opacity shadow-sm">
                B
              </Link>
              {/* C — verde original → verde mais escuro do projeto */}
              <Link href="/cadastro" type="button"
                className="w-12 h-12 bg-green-700 flex items-center justify-center rounded-full text-white font-bold text-lg hover:opacity-90 transition-opacity shadow-sm">
                C
              </Link>
            </div>

          </div>
        </div>

        {/* ── Wave SVG — idêntica ao clone, cor azul → verde do projeto ── */}
        <div className="absolute bottom-0 left-0 right-0 h-[50%] z-0 overflow-hidden pointer-events-none">
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="absolute -top-10 left-0 w-[150%] h-[150%] transform -translate-x-10"
            // #2594DF (azul) → green-700 do projeto
            style={{ color: "#15803d" }}
          >
            <path d="M0,40 C30,30 50,60 100,20 L100,100 L0,100 Z" fill="currentColor" />
          </svg>
        </div>

        {/* ── Rodapé — estrutura idêntica ao clone ── */}
        <div className="relative z-10 w-full flex flex-col items-center pb-8 sm:pb-8 pt-6">
          <p className="text-white/80 text-[11px] font-medium mb-1">
            Não tem uma conta?
          </p>
          <Link href="/cadastro" className="text-white text-[13px] font-bold hover:underline">
            Criar Conta
          </Link>
        </div>

      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-200/50">
        <Loader2 className="animate-spin text-green-600" size={36} />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
