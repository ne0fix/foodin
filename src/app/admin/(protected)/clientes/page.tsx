'use client';

import { useState, useEffect, useCallback, useTransition, Suspense } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
  Users, Search, Plus, Loader2, X, ChevronLeft, ChevronRight,
  User, Phone, FileText, MapPin, ShoppingBag, CheckCircle,
  XCircle, Pencil, Trash2, Save, Eye, EyeOff, Lock,
} from 'lucide-react';
import { formatarMoeda } from '@/src/utils/formatadores';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtCpf(cpf: string)  {
  const d = (cpf ?? '').replace(/\D/g, '');
  return d.length === 11 ? `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}` : cpf;
}
function fmtTel(tel: string) {
  const d = (tel ?? '').replace(/\D/g, '');
  if (d.length === 11) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;
  return tel;
}
function iniciais(nome: string) {
  return (nome ?? '').split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase();
}

// ─── Badge status pedido ──────────────────────────────────────────────────────

const STATUS_PAG: Record<string, { label: string; cls: string }> = {
  PAID:            { label: 'Pago',       cls: 'bg-green-100 text-green-700'  },
  PENDING_PAYMENT: { label: 'Aguardando', cls: 'bg-yellow-100 text-yellow-700'},
  CANCELLED:       { label: 'Cancelado',  cls: 'bg-red-100 text-red-700'      },
  FAILED:          { label: 'Falhou',     cls: 'bg-red-100 text-red-700'      },
  PROCESSING:      { label: 'Processando',cls: 'bg-blue-100 text-blue-700'    },
};

// ─── Modal Detalhes / Edição ─────────────────────────────────────────────────

function ModalCliente({ clienteId, onClose, onSaved, onDeleted }: {
  clienteId: string | null;
  isNovo: boolean;
  onClose: () => void;
  onSaved: () => void;
  onDeleted: () => void;
}) {
  const [cliente, setCliente]           = useState<any>(null);
  const [loading, setLoading]           = useState(false);
  const [editando, setEditando]         = useState(false);
  const [salvando, setSalvando]         = useState(false);
  const [excluindo, setExcluindo]       = useState(false);
  const [confirmarExcluir, setConfirmar] = useState(false);
  const [showPin, setShowPin]           = useState(false);
  const [aba, setAba]                   = useState<'info' | 'enderecos' | 'pedidos'>('info');
  const [form, setForm]                 = useState({ nome: '', whatsapp: '', pin: '', ativo: true });
  const [erro, setErro]                 = useState('');

  useEffect(() => {
    if (!clienteId) return;
    setLoading(true);
    fetch(`/api/admin/clientes/${clienteId}`)
      .then(r => r.json())
      .then(d => {
        setCliente(d);
        setForm({ nome: d.nome, whatsapp: fmtTel(d.whatsapp), pin: '', ativo: d.ativo });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [clienteId]);

  const salvar = async () => {
    setErro('');
    setSalvando(true);
    try {
      const body: any = {
        nome:     form.nome,
        whatsapp: form.whatsapp,
        ativo:    form.ativo,
      };
      if (form.pin) body.pin = form.pin;

      const res = await fetch(`/api/admin/clientes/${clienteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json();
        setErro(d.error ?? 'Erro ao salvar.');
        return;
      }
      const atualizado = await res.json();
      setCliente({ ...cliente, ...atualizado });
      setEditando(false);
      onSaved();
    } finally {
      setSalvando(false);
    }
  };

  const excluir = async () => {
    setExcluindo(true);
    try {
      await fetch(`/api/admin/clientes/${clienteId}`, { method: 'DELETE' });
      onDeleted();
    } finally {
      setExcluindo(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-600/30">
              <User size={18} className="text-white" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none mb-0.5">
                {loading ? 'Carregando…' : (cliente?.nome ?? 'Cliente')}
              </p>
              <h2 className="text-lg font-extrabold text-gray-900 leading-none">
                {loading ? '…' : `CPF: ${fmtCpf(cliente?.cpf ?? '')}`}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!editando && cliente && (
              <button
                onClick={() => setEditando(true)}
                className="hidden sm:flex items-center gap-1.5 h-9 px-3.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-600 rounded-xl text-xs font-bold transition-all"
              >
                <Pencil size={13} /> Editar
              </button>
            )}
            <button onClick={onClose} className="w-9 h-9 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-xl transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Abas */}
        {!loading && cliente && (
          <div className="flex border-b border-gray-100 px-5 flex-shrink-0">
            {(['info', 'enderecos', 'pedidos'] as const).map(a => (
              <button
                key={a}
                onClick={() => setAba(a)}
                className={`px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
                  aba === a ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                {a === 'info' ? 'Dados' : a === 'enderecos' ? `Endereços (${cliente.enderecos?.length ?? 0})` : `Pedidos (${cliente.pedidos?.length ?? 0})`}
              </button>
            ))}
          </div>
        )}

        {/* Conteúdo */}
        <div className="overflow-y-auto flex-1 p-4 sm:p-5">
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <Loader2 className="animate-spin text-blue-600" size={28} />
            </div>
          ) : !cliente ? (
            <p className="text-red-500 text-sm">Erro ao carregar cliente.</p>
          ) : (

            <>
              {/* ── ABA DADOS ── */}
              {aba === 'info' && (
                <div className="space-y-4">

                  {/* Avatar + nome + status */}
                  <div className="flex items-center gap-4 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                    <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-extrabold text-lg flex-shrink-0">
                      {iniciais(cliente.nome)}
                    </div>
                    <div className="flex-1 min-w-0">
                      {editando ? (
                        <input
                          value={form.nome}
                          onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                          className="w-full text-base font-bold text-gray-900 border-b border-blue-300 bg-transparent focus:outline-none pb-0.5"
                        />
                      ) : (
                        <p className="text-base font-bold text-gray-900 truncate">{cliente.nome}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-0.5">
                        Cadastrado em {new Date(cliente.criadoEm).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    {editando ? (
                      <button
                        onClick={() => setForm(f => ({ ...f, ativo: !f.ativo }))}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          form.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                        }`}
                      >
                        {form.ativo ? <CheckCircle size={13} /> : <XCircle size={13} />}
                        {form.ativo ? 'Ativo' : 'Inativo'}
                      </button>
                    ) : (
                      <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${
                        cliente.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                      }`}>
                        {cliente.ativo ? <CheckCircle size={13} /> : <XCircle size={13} />}
                        {cliente.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    )}
                  </div>

                  {/* Campos de contato */}
                  <div className="rounded-xl border border-gray-200 overflow-hidden">
                    <div className="flex items-center gap-2.5 px-4 py-3 bg-gray-50/80 border-b border-gray-100">
                      <FileText size={13} className="text-gray-500" />
                      <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Informações de Contato</h3>
                    </div>
                    <div className="divide-y divide-gray-100">
                      <div className="flex items-center gap-3 px-4 py-3">
                        <FileText size={14} className="text-gray-400 flex-shrink-0" />
                        <span className="text-xs text-gray-500 w-20 flex-shrink-0">CPF</span>
                        <span className="text-sm font-semibold text-gray-900">{fmtCpf(cliente.cpf)}</span>
                      </div>
                      <div className="flex items-center gap-3 px-4 py-3">
                        <Phone size={14} className="text-gray-400 flex-shrink-0" />
                        <span className="text-xs text-gray-500 w-20 flex-shrink-0">WhatsApp</span>
                        {editando ? (
                          <input
                            value={form.whatsapp}
                            onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))}
                            className="text-sm font-semibold text-gray-900 border-b border-blue-300 bg-transparent focus:outline-none flex-1"
                            placeholder="(85) 99999-9999"
                          />
                        ) : (
                          <span className="text-sm font-semibold text-gray-900">{fmtTel(cliente.whatsapp)}</span>
                        )}
                      </div>
                      {editando && (
                        <div className="flex items-center gap-3 px-4 py-3">
                          <Lock size={14} className="text-gray-400 flex-shrink-0" />
                          <span className="text-xs text-gray-500 w-20 flex-shrink-0">Novo PIN</span>
                          <div className="relative flex-1">
                            <input
                              type={showPin ? 'text' : 'password'}
                              maxLength={4}
                              value={form.pin}
                              onChange={e => setForm(f => ({ ...f, pin: e.target.value.replace(/\D/g, '') }))}
                              className="text-sm font-semibold text-gray-900 border-b border-blue-300 bg-transparent focus:outline-none w-20 tracking-widest"
                              placeholder="• • • •"
                            />
                            <button onClick={() => setShowPin(s => !s)} className="absolute right-0 top-0 text-gray-400">
                              {showPin ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                          </div>
                          <span className="text-[10px] text-gray-400">Deixe em branco para não alterar</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Resumo */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-indigo-50 rounded-xl p-3 text-center border border-indigo-100">
                      <p className="text-2xl font-extrabold text-indigo-700">{cliente.pedidos?.length ?? 0}</p>
                      <p className="text-xs text-indigo-500 font-semibold mt-0.5">Pedidos</p>
                    </div>
                    <div className="bg-teal-50 rounded-xl p-3 text-center border border-teal-100">
                      <p className="text-2xl font-extrabold text-teal-700">{cliente.enderecos?.length ?? 0}</p>
                      <p className="text-xs text-teal-500 font-semibold mt-0.5">Endereços</p>
                    </div>
                  </div>

                  {/* Erro */}
                  {erro && <p className="text-red-500 text-sm font-medium">{erro}</p>}

                  {/* Botões de ação */}
                  {editando ? (
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => { setEditando(false); setErro(''); }}
                        className="flex-1 h-10 border border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={salvar}
                        disabled={salvando}
                        className="flex-1 h-10 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-600/25"
                      >
                        {salvando ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                        Salvar
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => setEditando(true)}
                        className="flex-1 sm:hidden h-10 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                      >
                        <Pencil size={14} /> Editar
                      </button>
                      {confirmarExcluir ? (
                        <div className="flex-1 flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                          <span className="text-xs font-bold text-red-700 flex-1">Confirmar exclusão?</span>
                          <button
                            onClick={excluir}
                            disabled={excluindo}
                            className="h-7 px-3 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg flex items-center gap-1"
                          >
                            {excluindo ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
                            Excluir
                          </button>
                          <button onClick={() => setConfirmar(false)} className="h-7 px-2 text-xs text-gray-500 hover:bg-gray-100 rounded-lg">Cancelar</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmar(true)}
                          className="h-10 px-4 bg-white hover:bg-red-50 border border-red-200 hover:border-red-300 text-red-600 rounded-xl text-sm font-bold flex items-center gap-2 transition-all"
                        >
                          <Trash2 size={14} /> Excluir
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ── ABA ENDEREÇOS ── */}
              {aba === 'enderecos' && (
                <div className="space-y-3">
                  {cliente.enderecos?.length === 0 ? (
                    <div className="flex flex-col items-center py-12 gap-2 text-gray-400">
                      <MapPin size={28} className="text-gray-200" />
                      <p className="text-sm font-semibold">Nenhum endereço cadastrado</p>
                    </div>
                  ) : cliente.enderecos?.map((end: any) => (
                    <div key={end.id} className="rounded-xl border border-gray-200 p-4 space-y-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-gray-700 bg-gray-100 px-2.5 py-1 rounded-lg">{end.apelido}</span>
                        {end.principal && (
                          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Principal</span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-gray-900">
                        {end.logradouro}, {end.numero}{end.complemento ? ` — ${end.complemento}` : ''}
                      </p>
                      <p className="text-xs text-gray-500">{end.bairro} · {end.cidade} - {end.uf}</p>
                      <p className="text-xs text-gray-400">CEP {end.cep}</p>
                      {end.referencia && <p className="text-xs text-gray-400 italic">Ref: {end.referencia}</p>}
                    </div>
                  ))}
                </div>
              )}

              {/* ── ABA PEDIDOS ── */}
              {aba === 'pedidos' && (
                <div className="space-y-2">
                  {cliente.pedidos?.length === 0 ? (
                    <div className="flex flex-col items-center py-12 gap-2 text-gray-400">
                      <ShoppingBag size={28} className="text-gray-200" />
                      <p className="text-sm font-semibold">Nenhum pedido realizado</p>
                    </div>
                  ) : cliente.pedidos?.map((p: any) => {
                    const st = STATUS_PAG[p.status] ?? { label: p.status, cls: 'bg-gray-100 text-gray-600' };
                    return (
                      <div key={p.id} className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 hover:bg-gray-50/60 transition-colors">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-mono font-bold text-gray-900">#{p.id.slice(-8).toUpperCase()}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{new Date(p.criadoEm).toLocaleDateString('pt-BR')}</p>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>
                        <p className="text-sm font-bold text-gray-900 tabular-nums">{formatarMoeda(p.total)}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Modal Novo Cliente ───────────────────────────────────────────────────────

function ModalNovoCliente({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm]     = useState({ nome: '', cpf: '', whatsapp: '', pin: '' });
  const [salvando, setSalv] = useState(false);
  const [erro, setErro]     = useState('');
  const [showPin, setShow]  = useState(false);

  const salvar = async () => {
    setErro('');
    setSalv(true);
    try {
      const res = await fetch('/api/admin/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setErro(data.error ?? 'Erro ao criar cliente.'); return; }
      onSaved();
    } finally {
      setSalv(false);
    }
  };

  const field = (label: string, key: keyof typeof form, props?: any) => (
    <div>
      <label className="block text-xs font-bold text-gray-700 mb-1.5">{label}</label>
      <input
        value={form[key]}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        {...props}
      />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
              <Plus size={17} className="text-white" />
            </div>
            <h2 className="text-base font-extrabold text-gray-900">Novo Cliente</h2>
          </div>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-500">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {field('Nome completo', 'nome', { placeholder: 'Ex: João da Silva' })}
          {field('CPF', 'cpf', { placeholder: '000.000.000-00', maxLength: 14 })}
          {field('WhatsApp', 'whatsapp', { placeholder: '(85) 99999-9999' })}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">PIN (4 dígitos)</label>
            <div className="relative">
              <input
                type={showPin ? 'text' : 'password'}
                maxLength={4}
                value={form.pin}
                onChange={e => setForm(f => ({ ...f, pin: e.target.value.replace(/\D/g, '') }))}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10 tracking-widest"
                placeholder="• • • •"
              />
              <button onClick={() => setShow(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showPin ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          {erro && <p className="text-red-500 text-sm font-medium">{erro}</p>}
          <div className="flex gap-2 pt-1">
            <button onClick={onClose} className="flex-1 h-10 border border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50">Cancelar</button>
            <button
              onClick={salvar}
              disabled={salvando}
              className="flex-1 h-10 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-blue-600/25"
            >
              {salvando ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Cadastrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Conteúdo principal ───────────────────────────────────────────────────────

function ClientesContent() {
  const router     = useRouter();
  const pathname   = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [clientes, setClientes]             = useState<any[]>([]);
  const [loading, setLoading]               = useState(true);
  const [pagination, setPagination]         = useState({ page: 1, pages: 1, total: 0 });
  const [busca, setBusca]                   = useState(searchParams.get('q') ?? '');
  const [clienteSelecionado, setClienteSel] = useState<string | null>(null);
  const [mostrarNovo, setNovo]              = useState(false);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams(searchParams.toString());
      if (!q.get('page')) q.set('page', '1');
      const res  = await fetch(`/api/admin/clientes?${q.toString()}`);
      const json = await res.json();
      setClientes(json.clientes ?? []);
      setPagination({ page: json.page, pages: json.pages, total: json.total });
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => { carregar(); }, [carregar]);

  const setPage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(p));
    startTransition(() => router.replace(`${pathname}?${params.toString()}`));
  };

  const pesquisar = (value: string) => {
    setBusca(value);
    const params = new URLSearchParams(searchParams.toString());
    value ? params.set('q', value) : params.delete('q');
    params.delete('page');
    startTransition(() => router.replace(`${pathname}?${params.toString()}`));
  };

  return (
    <div className="space-y-6 pb-4">

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-sm text-gray-400 mt-0.5">{pagination.total} cliente(s) cadastrado(s)</p>
        </div>
        <button
          onClick={() => setNovo(true)}
          className="flex items-center gap-2 h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-blue-600/25 hover:-translate-y-0.5 active:translate-y-0"
        >
          <Plus size={16} /> Novo Cliente
        </button>
      </div>

      {/* Busca */}
      <div className={`relative transition-opacity ${isPending ? 'opacity-60' : ''}`}>
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={busca}
          onChange={e => pesquisar(e.target.value)}
          placeholder="Buscar por nome, CPF ou WhatsApp…"
          className="w-full sm:max-w-sm pl-9 pr-4 h-10 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
      </div>

      {/* Lista */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="animate-spin text-blue-600" size={28} />
          </div>
        ) : clientes.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16">
            <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center">
              <Users size={24} className="text-gray-300" />
            </div>
            <p className="text-sm font-semibold text-gray-400">Nenhum cliente encontrado</p>
          </div>
        ) : (
          <>
            {/* Cabeçalho colunas */}
            <div className="flex items-center gap-4 px-6 py-3 bg-gray-50 border-b border-gray-100">
              <div className="hidden sm:block w-10 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Nome</span>
              </div>
              <div className="hidden md:block w-[130px] flex-shrink-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">WhatsApp</span>
              </div>
              <div className="w-[80px] flex-shrink-0 text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Pedidos</span>
              </div>
              <div className="w-[80px] flex-shrink-0 text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Status</span>
              </div>
              <div className="w-14 flex-shrink-0 text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Ação</span>
              </div>
            </div>

            {/* Linhas */}
            <div className="divide-y divide-gray-50">
              {clientes.map(c => (
                <div key={c.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/60 transition-colors group">
                  {/* Avatar */}
                  <div className="hidden sm:flex w-10 h-10 rounded-xl bg-blue-600 items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                    {iniciais(c.nome)}
                  </div>

                  {/* Nome + CPF */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-700 transition-colors">{c.nome}</p>
                    <p className="text-[10px] text-gray-400 font-mono mt-0.5">{fmtCpf(c.cpf)}</p>
                  </div>

                  {/* WhatsApp */}
                  <div className="hidden md:block w-[130px] flex-shrink-0">
                    <p className="text-xs text-gray-600">{fmtTel(c.whatsapp)}</p>
                  </div>

                  {/* Pedidos */}
                  <div className="w-[80px] flex-shrink-0 text-center">
                    <span className="text-sm font-bold text-gray-900">{c._count?.pedidos ?? 0}</span>
                  </div>

                  {/* Status */}
                  <div className="w-[80px] flex-shrink-0 flex justify-center">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${c.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                      {c.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>

                  {/* Ação */}
                  <div className="w-14 flex-shrink-0 flex justify-center">
                    <button
                      onClick={() => setClienteSel(c.id)}
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 rounded-lg text-xs font-bold transition-all"
                    >
                      Ver
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Paginação */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-50 bg-gray-50/40">
            <p className="text-xs text-gray-500">
              Página <span className="font-bold text-gray-700">{pagination.page}</span> de {pagination.pages}
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={pagination.page === 1 || loading}
                onClick={() => setPage(pagination.page - 1)}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:text-blue-600 hover:border-blue-200 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                disabled={pagination.page === pagination.pages || loading}
                onClick={() => setPage(pagination.page + 1)}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:text-blue-600 hover:border-blue-200 disabled:opacity-40 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modais */}
      {clienteSelecionado && (
        <ModalCliente
          clienteId={clienteSelecionado}
          isNovo={false}
          onClose={() => setClienteSel(null)}
          onSaved={() => { setClienteSel(null); carregar(); }}
          onDeleted={() => { setClienteSel(null); carregar(); }}
        />
      )}
      {mostrarNovo && (
        <ModalNovoCliente
          onClose={() => setNovo(false)}
          onSaved={() => { setNovo(false); carregar(); }}
        />
      )}
    </div>
  );
}

export default function AdminClientesPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-16"><Loader2 className="animate-spin text-blue-600" size={28} /></div>}>
      <ClientesContent />
    </Suspense>
  );
}
