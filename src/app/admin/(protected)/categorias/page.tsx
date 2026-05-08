'use client';

import { useEffect, useState } from 'react';
import { Check, Trash2, Plus, Loader2 } from 'lucide-react';
import Toggle from '@/src/components/admin/ui/Toggle';
import ConfirmDialog from '@/src/components/admin/ui/ConfirmDialog';

interface Categoria {
  id: string;
  nome: string;
  icone: string;
  ordem: number;
  ativo: boolean;
}

interface LinhaEdicao {
  nome: string;
  icone: string;
  ordem: number;
  ativo: boolean;
}

export default function CategoriasPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [edicao, setEdicao] = useState<Record<string, LinhaEdicao>>({});
  const [salvando, setSalvando] = useState<Record<string, boolean>>({});
  const [excluindoId, setExcluindoId] = useState<string | null>(null);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [novaLinha, setNovaLinha] = useState<{ id: string; nome: string; icone: string; ordem: number } | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    fetch('/api/admin/categorias')
      .then((r) => r.json())
      .then((data) => {
        setCategorias(data);
        const inicial: Record<string, LinhaEdicao> = {};
        data.forEach((c: Categoria) => {
          inicial[c.id] = { nome: c.nome, icone: c.icone, ordem: c.ordem, ativo: c.ativo };
        });
        setEdicao(inicial);
      })
      .finally(() => setCarregando(false));
  }, []);

  async function salvar(id: string) {
    setSalvando((s) => ({ ...s, [id]: true }));
    setErros((e) => ({ ...e, [id]: '' }));
    try {
      const res = await fetch(`/api/admin/categorias/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(edicao[id]),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setErros((e) => ({ ...e, [id]: json.error ?? 'Erro ao salvar.' }));
        return;
      }
      const atualizada: Categoria = await res.json();
      setCategorias((cs) => cs.map((c) => (c.id === id ? atualizada : c)));
    } finally {
      setSalvando((s) => ({ ...s, [id]: false }));
    }
  }

  async function excluir(id: string) {
    const res = await fetch(`/api/admin/categorias/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setErros((e) => ({ ...e, [id]: json.error ?? 'Erro ao excluir.' }));
      return;
    }
    setCategorias((cs) => cs.filter((c) => c.id !== id));
    setEdicao((ed) => { const c = { ...ed }; delete c[id]; return c; });
    setExcluindoId(null);
  }

  async function criarCategoria() {
    if (!novaLinha) return;
    setSalvando((s) => ({ ...s, _nova: true }));
    try {
      const res = await fetch('/api/admin/categorias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novaLinha),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setErros((e) => ({ ...e, _nova: json.error ?? 'Erro ao criar.' }));
        return;
      }
      const criada: Categoria = await res.json();
      setCategorias((cs) => [...cs, criada]);
      setEdicao((ed) => ({
        ...ed,
        [criada.id]: { nome: criada.nome, icone: criada.icone, ordem: criada.ordem, ativo: criada.ativo },
      }));
      setNovaLinha(null);
    } finally {
      setSalvando((s) => ({ ...s, _nova: false }));
    }
  }

  if (carregando) {
    return (
      <div className="flex justify-center items-center py-32">
        <Loader2 className="animate-spin text-green-600" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Categorias</h1>
        <button
          onClick={() => setNovaLinha({ id: '', nome: '', icone: '📦', ordem: categorias.length })}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold px-4 py-2 rounded-lg"
        >
          <Plus size={16} /> Nova Categoria
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Ícone</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Nome</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600 w-24">Ordem</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-600 w-20">Ativo</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-600 w-24">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {/* Linha nova */}
            {novaLinha && (
              <tr className="bg-green-50">
                <td className="px-4 py-3">
                  <input
                    value={novaLinha.icone}
                    onChange={(e) => setNovaLinha((n) => n && { ...n, icone: e.target.value })}
                    className="w-14 border border-gray-200 rounded px-2 py-1 text-center text-lg bg-white"
                    maxLength={4}
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    value={novaLinha.nome}
                    onChange={(e) => setNovaLinha((n) => n && { ...n, nome: e.target.value })}
                    placeholder="Nome da categoria"
                    className="w-full border border-gray-200 rounded px-2 py-1 bg-white"
                  />
                  <input
                    value={novaLinha.id}
                    onChange={(e) => setNovaLinha((n) => n && { ...n, id: e.target.value })}
                    placeholder="slug-id (ex: hortifruti)"
                    className="w-full border border-gray-200 rounded px-2 py-1 mt-1 text-xs bg-white"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    value={novaLinha.ordem}
                    onChange={(e) => setNovaLinha((n) => n && { ...n, ordem: Number(e.target.value) })}
                    className="w-16 border border-gray-200 rounded px-2 py-1 bg-white"
                  />
                </td>
                <td className="px-4 py-3 text-center">—</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={criarCategoria}
                      disabled={salvando._nova}
                      className="text-green-600 hover:text-green-800 disabled:opacity-50"
                    >
                      {salvando._nova ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                    </button>
                    <button onClick={() => setNovaLinha(null)} className="text-gray-400 hover:text-gray-600">
                      ✕
                    </button>
                  </div>
                  {erros._nova && <p className="text-xs text-red-500 mt-1">{erros._nova}</p>}
                </td>
              </tr>
            )}

            {categorias.map((cat) => {
              const ed = edicao[cat.id] ?? { nome: cat.nome, icone: cat.icone, ordem: cat.ordem, ativo: cat.ativo };
              return (
                <tr key={cat.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <input
                      value={ed.icone}
                      onChange={(e) => setEdicao((prev) => ({ ...prev, [cat.id]: { ...ed, icone: e.target.value } }))}
                      className="w-14 border border-gray-200 rounded px-2 py-1 text-center text-lg"
                      maxLength={4}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      value={ed.nome}
                      onChange={(e) => setEdicao((prev) => ({ ...prev, [cat.id]: { ...ed, nome: e.target.value } }))}
                      className="w-full border border-gray-200 rounded px-2 py-1"
                    />
                    <p className="text-xs text-gray-400 mt-0.5">ID: {cat.id}</p>
                    {erros[cat.id] && <p className="text-xs text-red-500">{erros[cat.id]}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      value={ed.ordem}
                      onChange={(e) => setEdicao((prev) => ({ ...prev, [cat.id]: { ...ed, ordem: Number(e.target.value) } }))}
                      className="w-16 border border-gray-200 rounded px-2 py-1"
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Toggle
                      checked={ed.ativo}
                      onChange={() => setEdicao((prev) => ({ ...prev, [cat.id]: { ...ed, ativo: !ed.ativo } }))}
                      label="Ativo"
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => salvar(cat.id)}
                        disabled={salvando[cat.id]}
                        className="text-green-600 hover:text-green-800 disabled:opacity-50"
                        aria-label="Salvar"
                      >
                        {salvando[cat.id] ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                      </button>
                      <button
                        onClick={() => setExcluindoId(cat.id)}
                        className="text-red-400 hover:text-red-600"
                        aria-label="Excluir"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={!!excluindoId}
        titulo="Excluir categoria"
        mensagem="Esta ação é irreversível. Só é permitido excluir categorias sem produtos ativos."
        labelConfirmar="Excluir"
        onConfirm={() => excluindoId && excluir(excluindoId)}
        onCancel={() => setExcluindoId(null)}
      />
    </div>
  );
}
