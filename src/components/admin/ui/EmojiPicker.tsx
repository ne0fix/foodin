'use client';

import { useState, useRef, useEffect } from 'react';
import { Search } from 'lucide-react';

const GRUPOS = [
  {
    label: 'Frutas & Hortifruti',
    emojis: ['🥦','🥬','🥕','🥔','🍅','🌽','🌶️','🧅','🧄','🥒','🫑','🥑','🍆','🍠','🫛',
             '🍎','🍊','🍋','🍇','🍓','🍑','🍒','🍍','🥭','🍌','🍉','🍈','🍐','🫐','🍏'],
  },
  {
    label: 'Frios & Laticínios',
    emojis: ['🧀','🥛','🥚','🧈','🍳','🥩','🍗','🥓','🌭','🍖','🥚','🫙'],
  },
  {
    label: 'Congelados & Prontos',
    emojis: ['❄️','🧊','🍕','🥟','🍢','🥘','🫕','🍱','🥡','🍝','🍜','🧆','🥙'],
  },
  {
    label: 'Bebidas',
    emojis: ['🥤','🧃','☕','🍵','🧋','🍺','🍷','🥂','🍾','🥃','🍻','🫖','🧉','💧','🫗'],
  },
  {
    label: 'Padaria & Mercearia',
    emojis: ['🍞','🥐','🥖','🥨','🧁','🎂','🍰','🍪','🧇','🥞','🫓','🍚','🌾','🧂','🫙'],
  },
  {
    label: 'Higiene & Beleza',
    emojis: ['🧴','🧼','🪥','🚿','💊','💅','🪮','🧖','💄','🪒','🧻','🫧'],
  },
  {
    label: 'Limpeza',
    emojis: ['🧹','🧺','🪣','🧽','🪠','🫧','🧻','🪤','🗑️','🚮','🧯'],
  },
  {
    label: 'Pet Shop',
    emojis: ['🐕','🐈','🐾','🦮','🐠','🐹','🐇','🦜','🐾','🦴','🐟','🐱','🐶'],
  },
  {
    label: 'Utilidades & Casa',
    emojis: ['🔧','🔨','💡','🔌','🔋','📦','🪛','⚙️','🧲','🪜','🏠','🛋️','🪴'],
  },
  {
    label: 'Mercado & Geral',
    emojis: ['🛒','🏪','🏬','🛍️','💰','🏷️','📋','✅','⭐','🎁','🎯','📦'],
  },
];

const TODOS = GRUPOS.flatMap(g => g.emojis);

interface Props {
  value: string;
  onChange: (emoji: string) => void;
}

export default function EmojiPicker({ value, onChange }: Props) {
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setAberto(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const resultados = busca.trim()
    ? TODOS.filter(e => e.includes(busca))
    : null;

  return (
    <div className="relative" ref={ref}>
      {/* Botão atual */}
      <button
        type="button"
        onClick={() => setAberto(v => !v)}
        className="w-14 h-10 flex items-center justify-center text-2xl border border-gray-200 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors bg-white"
        title="Selecionar ícone"
      >
        {value || '📦'}
      </button>

      {/* Painel */}
      {aberto && (
        <div className="absolute left-0 top-12 z-50 w-80 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden">
          {/* Busca */}
          <div className="p-3 border-b border-gray-100">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
              <Search size={14} className="text-gray-400 flex-shrink-0" />
              <input
                autoFocus
                value={busca}
                onChange={e => setBusca(e.target.value)}
                placeholder="Buscar emoji..."
                className="flex-1 text-sm bg-transparent outline-none"
              />
            </div>
          </div>

          {/* Emojis */}
          <div className="overflow-y-auto max-h-72 p-2">
            {resultados ? (
              <div>
                <p className="text-xs text-gray-400 px-2 mb-2">Resultados</p>
                <div className="flex flex-wrap gap-1">
                  {resultados.map((e, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => { onChange(e); setAberto(false); setBusca(''); }}
                      className={`w-9 h-9 flex items-center justify-center text-xl rounded-lg hover:bg-green-50 transition-colors ${value === e ? 'bg-green-100 ring-2 ring-green-400' : ''}`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              GRUPOS.map(grupo => (
                <div key={grupo.label} className="mb-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-2 mb-1.5">
                    {grupo.label}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {grupo.emojis.map((e, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => { onChange(e); setAberto(false); }}
                        className={`w-9 h-9 flex items-center justify-center text-xl rounded-lg hover:bg-green-50 transition-colors ${value === e ? 'bg-green-100 ring-2 ring-green-400' : ''}`}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
