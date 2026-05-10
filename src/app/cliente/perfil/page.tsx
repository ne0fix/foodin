'use client';

import { useState, useEffect } from 'react';
import { User, MapPin, Plus, Trash2, Loader2, Home, Briefcase, Map } from 'lucide-react';
import { useViaCep } from '@/src/hooks/useViaCep';
import { formatarTelefone, formatarCPF } from '@/src/utils/validators';

interface Endereco {
  id: string;
  apelido: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string | null;
  referencia: string | null;
  bairro: string;
  cidade: string;
  uf: string;
  principal: boolean;
}

interface Cliente {
  id: string;
  nome: string;
  cpf: string;
  whatsapp: string;
  enderecos: Endereco[];
}

export default function PerfilPage() {
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [feedback, setFeedback] = useState({ tipo: '', msg: '' });

  // Estados do formulário de perfil
  const [nome, setNome] = useState('');
  const [whatsapp, setWhatsapp] = useState('');

  // Estados do formulário de endereço
  const [mostrandoAddEndereco, setMostrandoAddEndereco] = useState(false);
  const { buscar, buscando, erroCep } = useViaCep();
  const [novoEnd, setNovoEnd] = useState({
    apelido: 'Casa',
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    referencia: '',
    bairro: '',
    cidade: '',
    uf: ''
  });

  useEffect(() => {
    carregarPerfil();
  }, []);

  const carregarPerfil = async () => {
    try {
      const res = await fetch('/api/cliente/me');
      const data = await res.json();
      if (data.id) {
        setCliente(data);
        setNome(data.nome);
        setWhatsapp(formatarTelefone(data.whatsapp));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCarregando(false);
    }
  };

  const handleSalvarPerfil = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    setFeedback({ tipo: '', msg: '' });

    try {
      const res = await fetch('/api/cliente/perfil', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, whatsapp: whatsapp.replace(/\D/g, '') }),
      });

      if (res.ok) {
        setFeedback({ tipo: 'sucesso', msg: 'Perfil atualizado com sucesso!' });
        setTimeout(() => setFeedback({ tipo: '', msg: '' }), 3000);
      } else {
        setFeedback({ tipo: 'erro', msg: 'Erro ao atualizar perfil.' });
      }
    } catch (err) {
      setFeedback({ tipo: 'erro', msg: 'Erro de conexão.' });
    } finally {
      setSalvando(false);
    }
  };

  const handleAddEndereco = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);

    try {
      const res = await fetch('/api/cliente/enderecos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novoEnd),
      });

      if (res.ok) {
        setMostrandoAddEndereco(false);
        setNovoEnd({ apelido: 'Casa', cep: '', logradouro: '', numero: '', complemento: '', referencia: '', bairro: '', cidade: '', uf: '' });
        carregarPerfil();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSalvando(false);
    }
  };

  const handleSetPrincipal = async (id: string) => {
    try {
      await fetch(`/api/cliente/enderecos/${id}/principal`, { method: 'PUT' });
      carregarPerfil();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoverEndereco = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover este endereço?')) return;
    try {
      const res = await fetch(`/api/cliente/enderecos/${id}`, { method: 'DELETE' });
      if (res.ok) carregarPerfil();
      else {
        const data = await res.json();
        alert(data.error || 'Erro ao remover endereço.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCepChange = async (v: string) => {
    const limpo = v.replace(/\D/g, '').slice(0, 8);
    setNovoEnd({ ...novoEnd, cep: limpo });
    if (limpo.length === 8) {
      const dados = await buscar(limpo);
      if (dados) {
        setNovoEnd(prev => ({
          ...prev,
          logradouro: dados.logradouro,
          bairro: dados.bairro,
          cidade: dados.localidade,
          uf: dados.uf,
        }));
      }
    }
  };

  if (carregando) {
    return (
      <div className="py-12 flex justify-center">
        <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">

      <h1 className="text-2xl font-bold text-gray-900">Meu Perfil</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">

        {/* Lado Esquerdo: Dados Pessoais */}
        <section className="md:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 space-y-6">
            <h3 className="font-bold text-gray-900 flex items-center gap-2 text-sm uppercase tracking-wider text-gray-400">
              <User size={18} />
              Dados Pessoais
            </h3>

            <form onSubmit={handleSalvarPerfil} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide">Nome Completo</label>
                <input
                  required
                  type="text"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  className="w-full border border-gray-300 focus:border-green-500 rounded-xl px-4 py-2.5 outline-none transition-colors text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide">WhatsApp</label>
                <input
                  required
                  type="text"
                  value={whatsapp}
                  onChange={e => setWhatsapp(formatarTelefone(e.target.value))}
                  className="w-full border border-gray-300 focus:border-green-500 rounded-xl px-4 py-2.5 outline-none transition-colors text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide">CPF (Não editável)</label>
                <div className="w-full bg-gray-50 border border-gray-200 text-gray-400 rounded-xl px-4 py-2.5 text-sm font-medium">
                  {cliente ? formatarCPF(cliente.cpf) : '---'}
                </div>
              </div>

              {feedback.msg && (
                <p className={`text-xs font-bold ${feedback.tipo === 'sucesso' ? 'text-green-600' : 'text-red-600'}`}>
                  {feedback.msg}
                </p>
              )}

              <button
                disabled={salvando}
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-3 rounded-xl transition-all text-sm"
              >
                {salvando ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </form>
          </div>
        </section>

        {/* Lado Direito: Endereços */}
        <section className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 flex items-center gap-2 text-sm uppercase tracking-wider text-gray-400">
                <MapPin size={18} />
                Meus Endereços
              </h3>
              <button
                onClick={() => setMostrandoAddEndereco(true)}
                className="text-xs font-bold text-green-600 flex items-center gap-1 hover:underline"
              >
                <Plus size={16} /> Adicionar Novo
              </button>
            </div>

            <div className="divide-y divide-gray-100">
              {cliente?.enderecos.map(end => (
                <div key={end.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gray-50 text-gray-400 rounded-xl flex items-center justify-center flex-shrink-0">
                      {end.apelido === 'Casa' ? <Home size={20} /> : end.apelido === 'Trabalho' ? <Briefcase size={20} /> : <Map size={20} />}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">{end.apelido}</span>
                        {end.principal && (
                          <span className="bg-green-100 text-green-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">
                            Principal
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {end.logradouro}, {end.numero} {end.complemento && `(${end.complemento})`}
                      </p>
                      <p className="text-xs text-gray-500">
                        {end.bairro} · {end.cidade} - {end.uf} · {end.cep}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:flex-col sm:items-end self-start">
                    {!end.principal && (
                      <button
                        onClick={() => handleSetPrincipal(end.id)}
                        className="text-[10px] font-bold text-gray-400 hover:text-green-600 uppercase tracking-wide border border-gray-200 px-2 py-1 rounded-lg hover:border-green-300 transition-all"
                      >
                        Definir como principal
                      </button>
                    )}
                    <button
                      onClick={() => handleRemoverEndereco(end.id)}
                      className="text-red-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Modal/Form para novo endereço */}
          {mostrandoAddEndereco && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
              <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                  <h4 className="font-bold text-gray-900">Novo Endereço</h4>
                  <button onClick={() => setMostrandoAddEndereco(false)} className="text-gray-400 hover:text-gray-600">
                    <Plus size={24} className="rotate-45" />
                  </button>
                </div>

                <form onSubmit={handleAddEndereco} className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">Apelido (Ex: Casa)</label>
                      <input
                        required
                        type="text"
                        value={novoEnd.apelido}
                        onChange={e => setNovoEnd({ ...novoEnd, apelido: e.target.value })}
                        className="w-full border border-gray-300 focus:border-green-500 rounded-xl px-4 py-2.5 outline-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">CEP</label>
                      <input
                        required
                        type="text"
                        maxLength={8}
                        value={novoEnd.cep}
                        onChange={e => handleCepChange(e.target.value)}
                        className="w-full border border-gray-300 focus:border-green-500 rounded-xl px-4 py-2.5 outline-none text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Logradouro</label>
                    <input
                      required
                      readOnly
                      type="text"
                      value={novoEnd.logradouro}
                      className="w-full bg-gray-50 border border-gray-200 text-gray-400 rounded-xl px-4 py-2.5 outline-none text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">Número</label>
                      <input
                        required
                        type="text"
                        value={novoEnd.numero}
                        onChange={e => setNovoEnd({ ...novoEnd, numero: e.target.value })}
                        className="w-full border border-gray-300 focus:border-green-500 rounded-xl px-4 py-2.5 outline-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">Complemento</label>
                      <input
                        type="text"
                        value={novoEnd.complemento}
                        onChange={e => setNovoEnd({ ...novoEnd, complemento: e.target.value })}
                        className="w-full border border-gray-300 focus:border-green-500 rounded-xl px-4 py-2.5 outline-none text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-gray-500 mb-1">Cidade</label>
                      <input readOnly value={novoEnd.cidade} className="w-full bg-gray-50 border border-gray-200 text-gray-400 rounded-xl px-4 py-2.5 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">UF</label>
                      <input readOnly value={novoEnd.uf} className="w-full bg-gray-50 border border-gray-200 text-gray-400 rounded-xl px-4 py-2.5 text-sm text-center" />
                    </div>
                  </div>

                  <button
                    disabled={salvando || buscando}
                    type="submit"
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-4 rounded-xl transition-all shadow-lg mt-4 flex items-center justify-center gap-2"
                  >
                    {salvando ? <Loader2 className="animate-spin" size={20} /> : 'ADICIONAR ENDEREÇO'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </section>

      </div>

    </div>
  );
}
