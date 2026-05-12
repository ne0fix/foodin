'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, Loader2, ArrowRight, CheckCircle2, MapPin, User, Lock, Check } from 'lucide-react';
import { useViaCep } from '@/src/hooks/useViaCep';
import { PinInput } from '@/src/components/ui/PinInput';
import { validarCPF, formatarCPF, formatarTelefone } from '@/src/utils/validators';

const STEPS = ['Dados pessoais', 'Endereço', 'Segurança'];

export default function CadastroPage() {
  const router = useRouter();
  const { buscar, buscando, erroCep, setErroCep } = useViaCep();
  const numeroRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(0);
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [cep, setCep] = useState('');
  const [logradouro, setLogradouro] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [referencia, setReferencia] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [uf, setUf] = useState('');
  const [pin, setPin] = useState('');
  const [pinConfirmacao, setPinConfirmacao] = useState('');

  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  const handleCepChange = async (v: string) => {
    const limpo = v.replace(/\D/g, '').slice(0, 8);
    const fmt = limpo.length > 5 ? `${limpo.slice(0, 5)}-${limpo.slice(5)}` : limpo;
    setCep(fmt);
    if (limpo.length === 8) {
      const dados = await buscar(limpo);
      if (dados) {
        setLogradouro(dados.logradouro);
        setBairro(dados.bairro);
        setCidade(dados.localidade);
        setUf(dados.uf);
        numeroRef.current?.focus();
      }
    }
  };

  const validarStep = () => {
    setErro('');
    if (step === 0) {
      if (nome.trim().length < 3) { setErro('Nome deve ter no mínimo 3 caracteres'); return false; }
      if (!validarCPF(cpf.replace(/\D/g, ''))) { setErro('CPF inválido'); return false; }
      if (whatsapp.replace(/\D/g, '').length < 10) { setErro('WhatsApp inválido'); return false; }
    }
    if (step === 1) {
      if (cep.replace(/\D/g, '').length !== 8) { setErro('Informe um CEP válido'); return false; }
      if (!logradouro) { setErro('Consulte o CEP para preencher o endereço'); return false; }
      if (!numero) { setErro('Número é obrigatório'); return false; }
    }
    if (step === 2) {
      if (pin.length !== 4) { setErro('PIN deve ter 4 dígitos'); return false; }
      if (pin !== pinConfirmacao) { setErro('Os PINs não coincidem'); return false; }
    }
    return true;
  };

  const avancar = () => { if (validarStep()) setStep(s => s + 1); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validarStep()) return;
    setCarregando(true);
    try {
      const res = await fetch('/api/cliente/cadastrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome, cpf: cpf.replace(/\D/g, ''), whatsapp: whatsapp.replace(/\D/g, ''),
          pin, pinConfirmacao,
          endereco: { cep: cep.replace(/\D/g, ''), logradouro, numero, complemento: complemento || null, referencia: referencia || null, bairro, cidade, uf },
        }),
      });
      const data = await res.json();
      if (!res.ok) { setErro(data.error || 'Erro ao realizar cadastro'); return; }
      router.push('/cliente/login?sucesso=1');
    } catch { setErro('Erro de conexão. Tente novamente.'); }
    finally { setCarregando(false); }
  };

  const inputCls = (hasErr = false) =>
    `w-full px-4 py-3.5 bg-white border rounded-xl text-gray-900 placeholder-gray-300 text-sm
     focus:outline-none focus:ring-2 transition-all duration-200
     ${hasErr ? 'border-red-400 focus:ring-red-500/20 focus:border-red-400' : 'border-gray-200 focus:ring-green-500/20 focus:border-green-500'}`;

  const readonlyCls = 'w-full px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-xl text-gray-400 text-sm cursor-not-allowed';

  return (
    <div className="min-h-screen flex">

      {/* ─── Painel esquerdo ── */}
      <div className="hidden lg:flex lg:w-[420px] xl:w-[480px] flex-shrink-0 flex-col bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-green-400 translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-green-400 -translate-x-1/2 translate-y-1/2" />
        </div>
        <div className="relative z-10 flex flex-col h-full p-12">
          <Link href="/">
            <Image src="/foodin.png" alt="foodin" width={140} height={56} className="h-10 w-auto brightness-200" />
          </Link>
          <div className="flex-1 flex flex-col justify-center space-y-8">
            <div>
              <h2 className="text-3xl xl:text-4xl font-black text-white leading-snug">
                Crie sua conta<br />
                <span className="text-green-400">gratuitamente</span>
              </h2>
              <p className="text-gray-400 mt-3 leading-relaxed">
                Cadastre-se em minutos e tenha acesso a todos os benefícios.
              </p>
            </div>
            {/* Stepper lateral */}
            <div className="space-y-1">
              {STEPS.map((label, i) => (
                <div key={label} className="flex items-center gap-4">
                  <div className={`relative flex items-center justify-center w-9 h-9 rounded-full font-bold text-sm transition-all
                    ${i < step ? 'bg-green-500 text-white' : i === step ? 'bg-white text-gray-900 ring-2 ring-white/30' : 'bg-white/10 text-gray-500'}`}>
                    {i < step ? <Check size={16} /> : i + 1}
                    {i < STEPS.length - 1 && (
                      <div className={`absolute top-full left-1/2 -translate-x-1/2 w-0.5 h-6 mt-1
                        ${i < step ? 'bg-green-500' : 'bg-white/10'}`} />
                    )}
                  </div>
                  <span className={`font-medium text-sm pt-0.5 ${i === step ? 'text-white' : i < step ? 'text-green-400' : 'text-gray-500'}`}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <p className="text-gray-600 text-xs">© 2026 Ekomart</p>
        </div>
      </div>

      {/* ─── Painel direito — form ── */}
      <div className="flex-1 flex flex-col bg-gray-50">

        {/* Mobile top bar */}
        <div className="lg:hidden bg-white border-b border-gray-100 px-5 py-4 flex items-center gap-3">
          <button onClick={() => step > 0 ? setStep(s => s - 1) : router.back()} className="p-1.5 text-gray-500 hover:text-gray-900 -ml-1">
            <ChevronLeft size={22} />
          </button>
          <div className="flex-1">
            <div className="flex gap-1.5">
              {STEPS.map((_, i) => (
                <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= step ? 'bg-green-600' : 'bg-gray-200'}`} />
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1.5">Passo {step + 1} de {STEPS.length} — {STEPS[step]}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[480px] mx-auto px-5 py-10 lg:py-14 space-y-8">

            <div>
              <Link href="/" className="hidden lg:block mb-8">
                <Image src="/foodin.png" alt="foodin" width={120} height={48} className="h-9 w-auto" />
              </Link>
              <h1 className="text-2xl font-black text-gray-900">{STEPS[step]}</h1>
              <p className="text-gray-500 text-sm mt-1">
                {step === 0 && 'Informe seus dados de identificação'}
                {step === 1 && 'Onde você quer receber suas compras?'}
                {step === 2 && 'Crie um PIN de 4 dígitos para acessar sua conta'}
              </p>
            </div>

            {erro && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
                {erro}
              </div>
            )}

            {/* ─── Passo 0: Dados pessoais ── */}
            {step === 0 && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5"><User size={14} className="text-green-600" /> Nome completo</label>
                  <input type="text" value={nome} onChange={e => setNome(e.target.value)} placeholder="Como consta no documento" className={inputCls()} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">CPF</label>
                  <input type="text" inputMode="numeric" maxLength={14} value={cpf} onChange={e => setCpf(formatarCPF(e.target.value))} placeholder="000.000.000-00" className={inputCls()} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">WhatsApp</label>
                  <input type="text" inputMode="numeric" maxLength={15} value={whatsapp} onChange={e => setWhatsapp(formatarTelefone(e.target.value))} placeholder="(00) 00000-0000" className={inputCls()} />
                  <p className="text-xs text-gray-400">Usamos para confirmar seu pedido</p>
                </div>
                <button type="button" onClick={avancar} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl transition-all shadow-sm shadow-green-600/20 flex items-center justify-center gap-2 mt-2">
                  Continuar <ArrowRight size={18} />
                </button>
              </div>
            )}

            {/* ─── Passo 1: Endereço ── */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5"><MapPin size={14} className="text-green-600" /> CEP</label>
                  <div className="relative">
                    <input type="text" inputMode="numeric" maxLength={9} value={cep} onChange={e => handleCepChange(e.target.value)} placeholder="00000-000" className={inputCls(!!erroCep)} />
                    {buscando && <Loader2 size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-green-600 animate-spin" />}
                    {logradouro && !buscando && <CheckCircle2 size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500" />}
                  </div>
                  {erroCep && <p className="text-xs text-red-500">{erroCep}</p>}
                </div>

                {logradouro && (
                  <div className="bg-green-50 border border-green-100 rounded-xl p-4 space-y-1">
                    <p className="text-xs font-bold text-green-700 uppercase tracking-wider">Endereço encontrado</p>
                    <p className="text-sm font-bold text-gray-800">{logradouro}</p>
                    <p className="text-xs text-gray-600">{bairro} · {cidade} - {uf}</p>
                  </div>
                )}

                <div>
                  <label className="text-sm font-semibold text-gray-700">Logradouro</label>
                  <input readOnly value={logradouro} placeholder="Preenchido automaticamente pelo CEP" className={`mt-1.5 ${readonlyCls}`} />
                </div>

                <div className="grid grid-cols-5 gap-3">
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Número *</label>
                    <input ref={numeroRef} type="text" value={numero} onChange={e => setNumero(e.target.value)} placeholder="123" className={inputCls()} />
                  </div>
                  <div className="col-span-3 space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Complemento</label>
                    <input type="text" value={complemento} onChange={e => setComplemento(e.target.value)} placeholder="Apto, bloco..." className={inputCls()} />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="text-sm font-semibold text-gray-700">Cidade</label>
                    <input readOnly value={cidade} className={`mt-1.5 ${readonlyCls}`} />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700">UF</label>
                    <input readOnly value={uf} className={`mt-1.5 ${readonlyCls} text-center`} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">Ponto de referência <span className="text-gray-400 font-normal">(opcional)</span></label>
                  <input type="text" value={referencia} onChange={e => setReferencia(e.target.value)} placeholder="Ex: Próximo ao mercado X" className={inputCls()} />
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setStep(0)} className="flex-1 bg-white border border-gray-200 text-gray-700 font-bold py-4 rounded-xl hover:bg-gray-50 transition-colors">
                    Voltar
                  </button>
                  <button type="button" onClick={avancar} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl transition-all shadow-sm shadow-green-600/20 flex items-center justify-center gap-2">
                    Continuar <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            )}

            {/* ─── Passo 2: PIN ── */}
            {step === 2 && (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
                  <Lock size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800 leading-relaxed">
                    <strong>Importante:</strong> Seu PIN é a chave de acesso à sua conta. Escolha 4 dígitos fáceis de lembrar mas difíceis de adivinhar.
                  </p>
                </div>

                <div className="space-y-2">
                  <PinInput label="Crie seu PIN" value={pin} onChange={setPin} />
                </div>
                <div className="space-y-2">
                  <PinInput label="Confirme o PIN" value={pinConfirmacao} onChange={setPinConfirmacao} erro={pinConfirmacao.length === 4 && pin !== pinConfirmacao ? 'PINs não coincidem' : ''} />
                </div>

                {pin.length === 4 && pinConfirmacao.length === 4 && pin === pinConfirmacao && (
                  <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                    <CheckCircle2 size={16} /> PINs coincidem
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setStep(1)} className="flex-1 bg-white border border-gray-200 text-gray-700 font-bold py-4 rounded-xl hover:bg-gray-50 transition-colors">
                    Voltar
                  </button>
                  <button type="submit" disabled={carregando} className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-bold py-4 rounded-xl transition-all shadow-sm shadow-green-600/20 flex items-center justify-center gap-2">
                    {carregando ? <><Loader2 size={18} className="animate-spin" /> Criando...</> : <>Criar conta <Check size={18} /></>}
                  </button>
                </div>

                <p className="text-center text-sm text-gray-500">
                  Já tem conta?{' '}
                  <Link href="/cliente/login" className="text-green-600 font-bold hover:underline">Fazer login</Link>
                </p>
              </form>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
