'use client';

import { useState } from 'react';
import { MapPin, Store, Loader2 } from 'lucide-react';
import { DadosComprador, DadosEntrega, FreteResponse } from '@/src/models/checkout.model';
import { validarCPF, formatarCPF, formatarTelefone } from '@/src/utils/validators';
import { formatarMoeda } from '@/src/utils/formatadores';

interface Props {
  metodo: 'PIX' | 'CARTAO';
  subtotal: number;
  inicialComprador: DadosComprador | null;
  inicialEntrega: DadosEntrega | null;
  inicialFrete: number;
  onBack: () => void;
  onNext: (comprador: DadosComprador, entrega: DadosEntrega, frete: number) => void;
}

export default function StepDados({
  metodo, subtotal, inicialComprador, inicialEntrega, inicialFrete, onBack, onNext,
}: Props) {
  // ── Dados pessoais ────────────────────────────────────────────────────────
  const [nome, setNome]       = useState(inicialComprador?.nome      ?? '');
  const [email, setEmail]     = useState(inicialComprador?.email     ?? '');
  const [telefone, setTelefone] = useState(inicialComprador?.telefone ?? '');
  const [cpf, setCpf]         = useState(inicialComprador?.cpf       ?? '');

  // ── Entrega ───────────────────────────────────────────────────────────────
  const [tipoEntrega, setTipoEntrega] = useState<'ENTREGA' | 'RETIRADA'>(
    inicialEntrega?.tipo ?? 'ENTREGA'
  );
  const [cep, setCep]               = useState(inicialEntrega?.cep     ?? '');
  const [numero, setNumero]         = useState(inicialEntrega?.numero  ?? '');
  const [complemento, setComplemento] = useState(inicialEntrega?.complemento ?? '');
  const [dadosCep, setDadosCep]     = useState<FreteResponse | null>(null);
  const [buscando, setBuscando]     = useState(false);
  const [frete, setFrete]           = useState(inicialFrete);

  // ── Erros ─────────────────────────────────────────────────────────────────
  const [erros, setErros] = useState<Record<string, string>>({});

  // ── CEP ───────────────────────────────────────────────────────────────────
  const formatCep = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 8);
    return d.length > 5 ? d.replace(/(\d{5})(\d)/, '$1-$2') : d;
  };

  const buscarCep = async (valor: string) => {
    const limpo = valor.replace(/\D/g, '');
    if (limpo.length !== 8) return;
    setBuscando(true);
    setErros(e => ({ ...e, cep: '' }));
    try {
      const res = await fetch(`/api/frete/calcular?cep=${limpo}&subtotal=${subtotal}`);
      if (!res.ok) throw new Error('CEP não encontrado');
      const data: FreteResponse = await res.json();
      setDadosCep(data);
      setFrete(data.frete);
    } catch {
      setErros(e => ({ ...e, cep: 'CEP não encontrado. Verifique e tente novamente.' }));
      setDadosCep(null);
    } finally {
      setBuscando(false);
    }
  };

  // ── Validação ─────────────────────────────────────────────────────────────
  const validar = () => {
    const e: Record<string, string> = {};
    if (!nome.trim() || nome.trim().length < 3)   e.nome     = 'Nome completo obrigatório';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email    = 'E-mail inválido';
    if (telefone.replace(/\D/g, '').length < 10)   e.telefone = 'Telefone inválido';
    if (metodo === 'CARTAO') {
      if (!validarCPF(cpf.replace(/\D/g, '')))     e.cpf      = 'CPF inválido';
    }
    if (tipoEntrega === 'ENTREGA') {
      if (!dadosCep)                                e.cep      = 'Consulte o CEP primeiro';
      if (!numero.trim())                           e.numero   = 'Número obrigatório';
    }
    setErros(e);
    return Object.keys(e).length === 0;
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validar()) return;

    const comprador: DadosComprador = {
      nome:      nome.trim(),
      email:     email.trim().toLowerCase(),
      telefone:  telefone.replace(/\D/g, ''),
      cpf:       metodo === 'CARTAO' ? cpf.replace(/\D/g, '') : undefined,
    };

    const entrega: DadosEntrega = tipoEntrega === 'RETIRADA'
      ? { tipo: 'RETIRADA' }
      : {
          tipo:        'ENTREGA',
          cep:         cep.replace(/\D/g, ''),
          logradouro:  dadosCep?.logradouro ?? '',
          numero:      numero.trim(),
          complemento: complemento.trim(),
          bairro:      dadosCep?.bairro     ?? '',
          cidade:      dadosCep?.cidade     ?? '',
          uf:          dadosCep?.uf         ?? '',
        };

    onNext(comprador, entrega, tipoEntrega === 'RETIRADA' ? 0 : frete);
  };

  // ── Campo genérico ────────────────────────────────────────────────────────
  const Campo = ({
    label, value, onChange, type = 'text', placeholder = '', erro = '',
  }: {
    label: string; value: string; onChange: (v: string) => void;
    type?: string; placeholder?: string; erro?: string;
  }) => (
    <div>
      <label className="block text-sm font-bold text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full border rounded-xl px-4 py-3 text-sm outline-none transition-colors
          ${erro ? 'border-red-400 focus:border-red-500' : 'border-gray-300 focus:border-green-500'}`}
      />
      {erro && <p className="text-xs text-red-500 mt-1">{erro}</p>}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* Dados pessoais */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        <h2 className="text-xl font-extrabold text-gray-900">Seus dados</h2>

        <Campo
          label="Nome completo"
          value={nome}
          onChange={v => { setNome(v); setErros(e => ({ ...e, nome: '' })); }}
          placeholder="João da Silva"
          erro={erros.nome}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Campo
            label="Telefone / WhatsApp"
            value={telefone}
            onChange={v => {
              setTelefone(formatarTelefone(v));
              setErros(e => ({ ...e, telefone: '' }));
            }}
            type="tel"
            placeholder="(11) 99999-9999"
            erro={erros.telefone}
          />
          <Campo
            label="E-mail"
            value={email}
            onChange={v => { setEmail(v); setErros(e => ({ ...e, email: '' })); }}
            type="email"
            placeholder="joao@email.com"
            erro={erros.email}
          />
        </div>

        {/* CPF — somente cartão */}
        {metodo === 'CARTAO' && (
          <Campo
            label="CPF do titular do cartão"
            value={cpf}
            onChange={v => {
              setCpf(formatarCPF(v));
              setErros(e => ({ ...e, cpf: '' }));
            }}
            placeholder="000.000.000-00"
            erro={erros.cpf}
          />
        )}
      </div>

      {/* Entrega */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        <h2 className="text-xl font-extrabold text-gray-900">Entrega</h2>

        <div className="grid grid-cols-2 gap-3">
          {(['ENTREGA', 'RETIRADA'] as const).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setTipoEntrega(t)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors
                ${tipoEntrega === t ? 'border-green-600 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}
            >
              {t === 'ENTREGA'
                ? <MapPin size={20} className={tipoEntrega === t ? 'text-green-600' : 'text-gray-400'} />
                : <Store  size={20} className={tipoEntrega === t ? 'text-green-600' : 'text-gray-400'} />}
              <span className={`text-sm font-bold ${tipoEntrega === t ? 'text-green-700' : 'text-gray-600'}`}>
                {t === 'ENTREGA' ? 'Receber em casa' : 'Retirar na loja'}
              </span>
              {t === 'RETIRADA' && <span className="text-xs text-green-600 font-bold">Grátis</span>}
            </button>
          ))}
        </div>

        {tipoEntrega === 'ENTREGA' && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">CEP</label>
              <div className="flex gap-2">
                <input
                  value={cep}
                  onChange={e => {
                    const v = formatCep(e.target.value);
                    setCep(v);
                    setDadosCep(null);
                    if (v.replace(/\D/g, '').length === 8) buscarCep(v);
                  }}
                  placeholder="00000-000"
                  className={`flex-1 border rounded-xl px-4 py-3 text-sm outline-none transition-colors
                    ${erros.cep ? 'border-red-400' : 'border-gray-300 focus:border-green-500'}`}
                />
                {buscando && <Loader2 size={20} className="self-center animate-spin text-green-600" />}
              </div>
              {erros.cep && <p className="text-xs text-red-500 mt-1">{erros.cep}</p>}
            </div>

            {dadosCep && (
              <>
                <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 space-y-1">
                  <p className="font-bold">{dadosCep.logradouro}</p>
                  <p>{dadosCep.bairro} — {dadosCep.cidade}/{dadosCep.uf}</p>
                  <p className="font-bold text-green-600 mt-1">
                    Frete: {dadosCep.freteGratis ? 'Grátis' : formatarMoeda(dadosCep.frete)}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Número *</label>
                    <input
                      value={numero}
                      onChange={e => { setNumero(e.target.value); setErros(ev => ({ ...ev, numero: '' })); }}
                      placeholder="123"
                      className={`w-full border rounded-xl px-4 py-3 text-sm outline-none transition-colors
                        ${erros.numero ? 'border-red-400' : 'border-gray-300 focus:border-green-500'}`}
                    />
                    {erros.numero && <p className="text-xs text-red-500 mt-1">{erros.numero}</p>}
                  </div>
                  <Campo
                    label="Complemento"
                    value={complemento}
                    onChange={setComplemento}
                    placeholder="Apto, bloco..."
                  />
                </div>
              </>
            )}
          </div>
        )}

        {tipoEntrega === 'RETIRADA' && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm">
            <p className="font-bold text-green-800">📍 {process.env.NEXT_PUBLIC_LOJA_ENDERECO}</p>
            <p className="text-green-700 mt-1">🕐 {process.env.NEXT_PUBLIC_LOJA_HORARIO}</p>
          </div>
        )}
      </div>

      {/* Botões */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 border border-gray-300 text-gray-700 font-bold py-3.5 rounded-xl hover:bg-gray-50 transition-colors"
        >
          ← Voltar
        </button>
        <button
          type="submit"
          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-xl transition-colors"
        >
          Continuar →
        </button>
      </div>
    </form>
  );
}
