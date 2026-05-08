import { Produto, Categoria } from '../../models/produto.model';
import { mockProdutos, mockCategorias } from '../../mocks/produtos.mock';

// Simulating network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const ProdutoAPI = {
  async listarProdutos(): Promise<Produto[]> {
    return [...mockProdutos];
  },
  
  async obterProduto(id: string): Promise<Produto | null> {
    const produto = mockProdutos.find(p => p.id === id);
    return produto || null;
  },

  async listarCategorias(): Promise<Categoria[]> {
    return [...mockCategorias];
  },

  async buscarProdutos(query: string): Promise<Produto[]> {
    const lowerQuery = query.toLowerCase();
    return mockProdutos.filter(p => 
      p.nome.toLowerCase().includes(lowerQuery) || 
      p.descricao.toLowerCase().includes(lowerQuery)
    );
  }
};
