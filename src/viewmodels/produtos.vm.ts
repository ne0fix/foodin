import { useState, useEffect, useCallback } from 'react';
import { Produto } from '../models/produto.model';
import { ProdutoAPI } from '../services/api/produto.api';

export function useProdutosViewModel() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregarProdutos = useCallback(async () => {
    try {
      setCarregando(true);
      setErro(null);
      const data = await ProdutoAPI.listarProdutos();
      setProdutos(data);
    } catch (e) {
      setErro('Erro ao carregar produtos');
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarProdutos();
  }, [carregarProdutos]);

  return {
    produtos,
    carregando,
    erro,
    recarregar: carregarProdutos
  };
}

export function useProdutoDetailViewModel(id: string) {
    const [produto, setProduto] = useState<Produto | null>(null);
    const [carregando, setCarregando] = useState(true);
    const [quantidadeSelecionada, setQuantidadeSelecionada] = useState(1);
  
    useEffect(() => {
      let ativo = true;
      const carregar = async () => {
        setCarregando(true);
        const data = await ProdutoAPI.obterProduto(id);
        if (ativo) {
          setProduto(data);
          setCarregando(false);
        }
      };
      
      if (id) carregar();
      
      return () => { ativo = false; };
    }, [id]);
  
    const incrementarQuantidade = () => setQuantidadeSelecionada(q => q + 1);
    const decrementarQuantidade = () => setQuantidadeSelecionada(q => Math.max(1, q - 1));
  
    return {
      produto,
      carregando,
      quantidadeSelecionada,
      incrementarQuantidade,
      decrementarQuantidade
    };
  }
