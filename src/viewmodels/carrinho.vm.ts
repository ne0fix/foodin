import { useState, useEffect } from 'react';
import { ItemCarrinho, Produto } from '../models/produto.model';

// Para simplificar, usando um estado global simples na memória (numa app real, context/zustand/redux)
let carrinhoGlobal: ItemCarrinho[] = [];
let listeners: Array<() => void> = [];

const notificar = () => listeners.forEach(l => l());

export function useCarrinhoViewModel() {
  const [itens, setItens] = useState<ItemCarrinho[]>(carrinhoGlobal);

  // Inscreve para mudanças
  useEffect(() => {
    const listener = () => setItens([...carrinhoGlobal]);
    listeners.push(listener);
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  }, []);

  const subtotal = itens.reduce((acc, item) => acc + (item.produto.preco * item.quantidade), 0);
  const frete = subtotal > 100 ? 0 : 15; // Frete grátis acima de $100
  const impostos = subtotal * 0.05; // 5% de imposto fictício
  const total = subtotal + frete + impostos;

  const adicionarItem = (produto: Produto, quantidade: number = 1) => {
    const existe = carrinhoGlobal.find(i => i.produto.id === produto.id);
    if (existe) {
      existe.quantidade += quantidade;
    } else {
      carrinhoGlobal.push({ produto, quantidade });
    }
    notificar();
  };

  const removerItem = (produtoId: string) => {
    carrinhoGlobal = carrinhoGlobal.filter(i => i.produto.id !== produtoId);
    notificar();
  };

  const atualizarQuantidade = (produtoId: string, quantidade: number) => {
    const item = carrinhoGlobal.find(i => i.produto.id === produtoId);
    if (item) {
      item.quantidade = quantidade;
      if (item.quantidade <= 0) removerItem(produtoId);
      else notificar();
    }
  };

  const limparCarrinho = () => {
    carrinhoGlobal = [];
    notificar();
  };

  return {
    itens,
    quantidadeTotal: itens.reduce((acc, item) => acc + item.quantidade, 0),
    subtotal,
    frete,
    impostos,
    total,
    adicionarItem,
    removerItem,
    atualizarQuantidade,
    limparCarrinho
  };
}
