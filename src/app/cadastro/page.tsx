'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { useViaCep } from '@/src/hooks/useViaCep';
import { PinInput } from '@/src/components/ui/PinInput';
import { validarCPF, formatarCPF, formatarTelefone } from '@/src/utils/validators';

export default function CadastroPage() {
  const router = useRouter();
  const { buscar, buscando, erroCep } = useViaCep();
  const numeroRef = useRef<HTMLInputElement>(null);

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
    const formatado = limpo.length > 5 ? `${limpo.slice(0, 5)}-${limpo.slice(5)}` : limpo;
    setCep(formatado);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');

    // Validações client-side
    if (nome.length < 3) return setErro('Nome deve ter no mínimo 3 caracteres');
    const cpfLimpo = cpf.replace(/\D/g, '');
    if (!validarCPF(cpfLimpo)) return setErro('CPF inválido');
    if (whatsapp.replace(/\D/g, '').length < 10) return setErro('WhatsApp inválido');
    if (cep.replace(/\D/g, '').length !== 8) return setErro('CEP inválido');
    if (!numero) return setErro('Número é obrigatório');
    if (pin.length !== 4) return setErro('PIN deve ter 4 dígitos');
    if (pin !== pinConfirmacao) return setErro('Os PINs não coincidem');

    setCarregando(true);

    try {
      const res = await fetch('/api/cliente/cadastrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome,
          cpf: cpfLimpo,
          whatsapp: whatsapp.replace(/\D/g, ''),
          pin,
          pinConfirmacao,
          endereco: {
            cep: cep.replace(/\D/g, ''),
            logradouro,
            numero,
            complemento: complemento || null,
            referencia: referencia || null,
            bairro,
            cidade,
            uf,
          }
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErro(data.error || 'Erro ao realizar cadastro');
        return;
      }

      router.push('/cliente/login?sucesso=1');

    } catch (err) {
      setErro('Erro de conexão. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="container mx-auto px-4 max-w-xl">
        
        {/* Header */}
        <div className="py-6 flex items-center justify-between">
          <button onClick={() => router.back()} className="p-2 -ml-2 text-gray-600 hover:text-green-600">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Criar minha conta</h1>
          <div className="w-10" /> {/* Spacer */}
        </div>

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Image src="/gn2.png" alt="Ekomart" width={180} height={80} priority className="h-16 w-auto" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Dados Pessoais */}
          <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Seus Dados</h2>
            
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Nome completo *</label>
              <input
                required
                type="text"
                value={nome}
                onChange={e => setNome(e.target.value)}
                placeholder="Como consta no documento"
                className="w-full border border-gray-300 focus:border-green-500 rounded-xl px-4 py-3 outline-none transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">CPF *</label>
                <input
                  required
                  type="text"
                  inputMode="numeric"
                  maxLength={14}
                  value={cpf}
                  onChange={e => setCpf(formatarCPF(e.target.value))}
                  placeholder="000.000.000-00"
                  className="w-full border border-gray-300 focus:border-green-500 rounded-xl px-4 py-3 outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">WhatsApp *</label>
                <input
                  required
                  type="text"
                  inputMode="numeric"
                  maxLength={15}
                  value={whatsapp}
                  onChange={e => setWhatsapp(formatarTelefone(e.target.value))}
                  placeholder="(00) 00000-0000"
                  className="w-full border border-gray-300 focus:border-green-500 rounded-xl px-4 py-3 outline-none transition-colors"
                />
              </div>
            </div>
          </section>

          {/* Endereço */}
          <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Endereço de Entrega</h2>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">CEP *</label>
              <div className="relative">
                <input
                  required
                  type="text"
                  inputMode="numeric"
                  maxLength={9}
                  value={cep}
                  onChange={e => handleCepChange(e.target.value)}
                  placeholder="00000-000"
                  className={`w-full border rounded-xl px-4 py-3 outline-none transition-colors pr-12
                    ${erroCep ? 'border-red-400' : 'border-gray-300 focus:border-green-500'}`}
                />
                {buscando && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <Loader2 size={20} className="text-green-600 animate-spin" />
                  </div>
                )}
              </div>
              {erroCep && <p className="text-xs text-red-500 mt-1">{erroCep}</p>}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Logradouro *</label>
              <input
                required
                readOnly
                type="text"
                value={logradouro}
                className="w-full bg-gray-50 border border-gray-200 text-gray-500 rounded-xl px-4 py-3 outline-none"
                placeholder="Rua, Avenida, etc."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Número *</label>
                <input
                  required
                  ref={numeroRef}
                  type="text"
                  value={numero}
                  onChange={e => setNumero(e.target.value)}
                  placeholder="123"
                  className="w-full border border-gray-300 focus:border-green-500 rounded-xl px-4 py-3 outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Complemento</label>
                <input
                  type="text"
                  value={complemento}
                  onChange={e => setComplemento(e.target.value)}
                  placeholder="Apto, Bloco..."
                  className="w-full border border-gray-300 focus:border-green-500 rounded-xl px-4 py-3 outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Bairro *</label>
              <input
                required
                readOnly
                type="text"
                value={bairro}
                className="w-full bg-gray-50 border border-gray-200 text-gray-500 rounded-xl px-4 py-3 outline-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-1">Cidade *</label>
                <input
                  required
                  readOnly
                  type="text"
                  value={cidade}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-500 rounded-xl px-4 py-3 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">UF *</label>
                <input
                  required
                  readOnly
                  type="text"
                  value={uf}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-500 rounded-xl px-4 py-3 outline-none text-center uppercase"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Ponto de Referência</label>
              <input
                type="text"
                value={referencia}
                onChange={e => setReferencia(e.target.value)}
                placeholder="Ex: Próximo ao mercado X"
                className="w-full border border-gray-300 focus:border-green-500 rounded-xl px-4 py-3 outline-none transition-colors"
              />
            </div>
          </section>

          {/* Segurança */}
          <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-6">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Crie seu PIN de acesso</h2>
            
            <PinInput
              label="PIN de 4 dígitos *"
              value={pin}
              onChange={setPin}
              erro={erro.includes('PIN') ? erro : ''}
            />

            <PinInput
              label="Confirme seu PIN *"
              value={pinConfirmacao}
              onChange={setPinConfirmacao}
              erro={erro === 'Os PINs não coincidem' ? erro : ''}
            />

            <p className="text-xs text-gray-500 leading-relaxed bg-green-50 p-3 rounded-lg border border-green-100">
              💡 O PIN é a sua senha de 4 dígitos. Guarde-o bem, ele será solicitado em todos os seus acessos.
            </p>
          </section>

          {/* Erro */}
          {erro && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-medium">
              {erro}
            </div>
          )}

          {/* Submit */}
          <button
            disabled={carregando}
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-4 rounded-xl transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {carregando ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              'CRIAR MINHA CONTA'
            )}
          </button>

          <p className="text-center text-sm text-gray-600">
            Já tem conta? <Link href="/cliente/login" className="text-green-600 font-bold hover:underline">Fazer login</Link>
          </p>

        </form>
      </div>
    </div>
  );
}
