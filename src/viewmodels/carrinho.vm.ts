'use client';

import { useState, useEffect, useCallback } from 'react';
import { ItemCarrinho, Produto } from '../models/produto.model';

const STORAGE_KEY = 'ekomart:carrinho';

function lerStorage(): ItemCarrinho[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function salvarStorage(itens: ItemCarrinho[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(itens));
}

// Pub/sub para sincronizar entre hooks na mesma aba
let listeners: Array<() => void> = [];
const notificar = () => listeners.forEach(l => l());

export function useCarrinhoViewModel() {
  const [itens, setItens] = useState<ItemCarrinho[]>([]);

  // Hidratação no cliente
  useEffect(() => {
    setItens(lerStorage());

    const listener = () => setItens(lerStorage());
    listeners.push(listener);

    // Sincronizar entre abas
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setItens(lerStorage());
    };
    window.addEventListener('storage', onStorage);

    return () => {
      listeners = listeners.filter(l => l !== listener);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const subtotal = itens.reduce((acc, item) => acc + item.produto.preco * item.quantidade, 0);
  const limiteFreteGratis = parseFloat(process.env.NEXT_PUBLIC_FRETE_GRATIS_ACIMA ?? '200');
  const freteEstimado = subtotal >= limiteFreteGratis ? 0 : 15;
  const total = subtotal + freteEstimado;

  const adicionarItem = useCallback((produto: Produto, quantidade = 1) => {
    if (!produto.emEstoque) return;
    const itensAtuais = lerStorage();
    const idx = itensAtuais.findIndex(i => i.produto.id === produto.id);
    if (idx >= 0) {
      itensAtuais[idx].quantidade += quantidade;
    } else {
      itensAtuais.push({ produto, quantidade });
    }
    salvarStorage(itensAtuais);
    notificar();
  }, []);

  const removerItem = useCallback((produtoId: string) => {
    const novos = lerStorage().filter(i => i.produto.id !== produtoId);
    salvarStorage(novos);
    notificar();
  }, []);

  const atualizarQuantidade = useCallback((produtoId: string, quantidade: number) => {
    const itensAtuais = lerStorage();
    const idx = itensAtuais.findIndex(i => i.produto.id === produtoId);
    if (idx < 0) return;
    if (quantidade <= 0) {
      itensAtuais.splice(idx, 1);
    } else {
      itensAtuais[idx].quantidade = quantidade;
    }
    salvarStorage(itensAtuais);
    notificar();
  }, []);

  const limparCarrinho = useCallback(() => {
    salvarStorage([]);
    notificar();
  }, []);

  // Atualiza preços do carrinho buscando os valores atuais da API.
  // Chamado no início do checkout para evitar exibir preços desatualizados.
  const refreshPrecos = useCallback(async () => {
    const itensAtuais = lerStorage();
    if (!itensAtuais.length) return;

    try {
      const resultados = await Promise.all(
        itensAtuais.map(item =>
          fetch(`/api/produtos/${item.produto.id}`)
            .then(r => r.ok ? r.json() : null)
            .catch(() => null)
        )
      );

      let atualizado = false;
      resultados.forEach((produto, i) => {
        if (produto?.preco !== undefined) {
          const novoPreco = parseFloat(produto.preco);
          if (itensAtuais[i].produto.preco !== novoPreco) {
            itensAtuais[i].produto.preco = novoPreco;
            itensAtuais[i].produto.nome  = produto.nome ?? itensAtuais[i].produto.nome;
            atualizado = true;
          }
        }
      });

      if (atualizado) {
        salvarStorage(itensAtuais);
        notificar();
      }
    } catch { /* ignora erros de rede */ }
  }, []);

  return {
    itens,
    quantidadeTotal: itens.reduce((acc, item) => acc + item.quantidade, 0),
    subtotal,
    freteEstimado,
    total,
    adicionarItem,
    removerItem,
    atualizarQuantidade,
    limparCarrinho,
    refreshPrecos,
  };
}
