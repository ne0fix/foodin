'use client';
import { useEffect, useState } from 'react';
import { Plus, Pencil, Loader2, Bike } from 'lucide-react';

interface Entregador {
  id: string;
  nome: string;
  telefone: string;
  ativo: boolean;
  criadoEm: string;
  pedidosEntregues: number;
}

function formatarTelefone(t: string) {
  const d = t.replace(/\D/g, '');
  if (d.length === 11) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
  return t;
}

export default function EntregadoresPage() {
  const [lista, setLista] = useState<Entregador[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [modalNovo, setModalNovo] = useState(false);
  const [modalEditar, setModalEditar] = useState<Entregador | null>(null);
  const [form, setForm] = useState({ nome: '', telefone: '', senha: '' });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  async function carregar() {
    const r = await fetch('/api/admin/entregadores');
    if (r.ok) setLista(await r.json());
    setCarregando(false);
  }

  useEffect(() => { carregar(); }, []);

  async function handleCriar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErro('');
    const r = await fetch('/api/admin/entregadores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: form.nome, telefone: form.telefone, senha: form.senha }),
    });
    if (r.ok) {
      setModalNovo(false);
      setForm({ nome: '', telefone: '', senha: '' });
      carregar();
    } else {
      const d = await r.json();
      setErro(d.error ?? 'Erro ao criar');
    }
    setSalvando(false);
  }

  async function handleEditar(e: React.FormEvent) {
    e.preventDefault();
    if (!modalEditar) return;
    setSalvando(true);
    setErro('');
    const r = await fetch(`/api/admin/entregadores/${modalEditar.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: form.nome, telefone: form.telefone }),
    });
    if (r.ok) {
      setModalEditar(null);
      setForm({ nome: '', telefone: '', senha: '' });
      carregar();
    } else {
      const d = await r.json();
      setErro(d.error ?? 'Erro ao editar');
    }
    setSalvando(false);
  }

  async function toggleAtivo(e: Entregador) {
    await fetch(`/api/admin/entregadores/${e.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ativo: !e.ativo }),
    });
    carregar();
  }

  function abrirEditar(e: Entregador) {
    setForm({ nome: e.nome, telefone: e.telefone, senha: '' });
    setErro('');
    setModalEditar(e);
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Entregadores</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gerencie os entregadores da plataforma</p>
        </div>
        <button
          onClick={() => { setForm({ nome: '', telefone: '', senha: '' }); setErro(''); setModalNovo(true); }}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-colors"
        >
          <Plus size={16} /> Novo Entregador
        </button>
      </div>

      {carregando ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : lista.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Bike size={48} className="mb-3 text-gray-300" />
          <p className="font-semibold">Nenhum entregador cadastrado</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-bold text-gray-600">Nome</th>
                <th className="text-left px-4 py-3 font-bold text-gray-600">Telefone</th>
                <th className="text-center px-4 py-3 font-bold text-gray-600">Status</th>
                <th className="text-center px-4 py-3 font-bold text-gray-600">Entregas</th>
                <th className="text-right px-4 py-3 font-bold text-gray-600">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {lista.map(e => (
                <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{e.nome}</td>
                  <td className="px-4 py-3 text-gray-600">{formatarTelefone(e.telefone)}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => toggleAtivo(e)}
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                        e.ativo
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {e.ativo ? 'Ativo' : 'Inativo'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-600 font-medium">{e.pedidosEntregues}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => abrirEditar(e)}
                      className="text-gray-400 hover:text-green-600 transition-colors p-1.5 rounded-lg hover:bg-green-50"
                    >
                      <Pencil size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Novo */}
      {modalNovo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-black text-gray-900 mb-4">Novo Entregador</h2>
            <form onSubmit={handleCriar} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Nome</label>
                <input required value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Telefone</label>
                <input required value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))}
                  placeholder="(85) 99999-9999"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Senha</label>
                <input required type="password" value={form.senha} onChange={e => setForm(f => ({ ...f, senha: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500" />
              </div>
              {erro && <p className="text-red-500 text-xs">{erro}</p>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModalNovo(false)}
                  className="flex-1 border border-gray-200 text-gray-600 font-bold py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={salvando}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors">
                  {salvando ? <Loader2 size={14} className="animate-spin" /> : null} Criar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar */}
      {modalEditar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-black text-gray-900 mb-4">Editar Entregador</h2>
            <form onSubmit={handleEditar} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Nome</label>
                <input required value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Telefone</label>
                <input required value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-500" />
              </div>
              {erro && <p className="text-red-500 text-xs">{erro}</p>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModalEditar(null)}
                  className="flex-1 border border-gray-200 text-gray-600 font-bold py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={salvando}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors">
                  {salvando ? <Loader2 size={14} className="animate-spin" /> : null} Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
