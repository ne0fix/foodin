'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import SecaoCard from '@/src/components/admin/SecaoCard';
import { SecaoAdminDTO } from '@/src/lib/dto';

interface CategoriaOpcao { id: string; nome: string }
interface TagOpcao { id: string; label: string }

const TAGS_PADRAO: TagOpcao[] = [
  { id: 'desconto', label: 'Desconto' },
  { id: 'fresco', label: 'Fresco' },
  { id: 'organico', label: 'Orgânico' },
  { id: 'sem-gluten', label: 'Sem Glúten' },
  { id: 'sem-lactose', label: 'Sem Lactose' },
];

export default function SecoesPage() {
  const [secoes, setSecoes] = useState<SecaoAdminDTO[]>([]);
  const [categorias, setCategorias] = useState<CategoriaOpcao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [criando, setCriando] = useState(false);
  const [erro, setErro] = useState('');

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const [resSecoes, resCats] = await Promise.all([
        fetch('/api/admin/secoes'),
        fetch('/api/admin/categorias'),
      ]);
      setSecoes(await resSecoes.json());
      setCategorias(await resCats.json());
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  async function criarSecao() {
    const slug = `secao-${Date.now()}`;
    setCriando(true);
    setErro('');
    try {
      const res = await fetch('/api/admin/secoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          titulo: 'Nova Seção',
          modoSelecao: 'AUTOMATICO',
          maxItens: 8,
          ordem: secoes.length,
        }),
      });
      if (!res.ok) { setErro('Falha ao criar seção.'); return; }
      const nova: SecaoAdminDTO = await res.json();
      setSecoes((s) => [...s, nova]);
    } finally {
      setCriando(false);
    }
  }

  function handleDeleted(id: string) {
    setSecoes((s) => s.filter((sec) => sec.id !== id));
  }

  function handleSaved(atualizada: SecaoAdminDTO) {
    setSecoes((s) => s.map((sec) => (sec.id === atualizada.id ? atualizada : sec)));
  }

  async function moverSecao(id: string, direction: 'up' | 'down') {
    const idx = secoes.findIndex((s) => s.id === id);
    if (idx < 0) return;
    const troca = direction === 'up' ? idx - 1 : idx + 1;
    if (troca < 0 || troca >= secoes.length) return;

    const novas = [...secoes];
    [novas[idx], novas[troca]] = [novas[troca], novas[idx]];
    setSecoes(novas);

    await Promise.all([
      fetch(`/api/admin/secoes/${novas[idx].id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ordem: idx }),
      }),
      fetch(`/api/admin/secoes/${novas[troca].id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ordem: troca }),
      }),
    ]);
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Seções da Home</h1>
          <p className="text-sm text-gray-500 mt-1">
            Configure quais produtos aparecem em cada seção da página inicial.
          </p>
        </div>
        <button
          onClick={criarSecao}
          disabled={criando}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-bold px-4 py-2 rounded-lg"
        >
          {criando ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
          Nova Seção
        </button>
      </div>

      {erro && <p className="text-sm text-red-500">{erro}</p>}

      {secoes.length === 0 ? (
        <div className="text-center py-24 text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl">
          <p className="text-lg font-semibold">Nenhuma seção configurada.</p>
          <p className="text-sm mt-1">Clique em &quot;Nova Seção&quot; para começar.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {secoes.map((secao, index) => (
            <SecaoCard
              key={secao.id}
              secao={secao}
              categorias={categorias}
              tags={TAGS_PADRAO}
              onDeleted={handleDeleted}
              onSaved={handleSaved}
              onMoveUp={() => moverSecao(secao.id, 'up')}
              onMoveDown={() => moverSecao(secao.id, 'down')}
              isFirst={index === 0}
              isLast={index === secoes.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
