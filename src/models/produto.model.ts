export interface Produto {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  precoOriginal?: number | null;
  imagem: string;
  imagens?: string[];
  categoria: string;
  categoriaId?: string;
  subcategoria?: string;
  emEstoque: boolean;
  quantidadePacote: string; // ex: "Individual", "Família (8 fatias)", "30-45 min"
  tempoEntrega?: string;    // derivado de quantidadePacote ou fallback de env
  avaliacao: number;
  numAvaliacoes: number;
  tags: string[]; // ex: "vegano", "sem glúten", "picante"
}

export interface Categoria {
  id: string;
  nome: string;
  icone: string; // URL da imagem ou emoji
}

export interface ItemCarrinho {
  produto: Produto;
  quantidade: number;
}

export interface ProdutoCardPrato extends Produto {
  porcao: string;      // alias de quantidadePacote
  tempoEntrega: string;
  disponivel: boolean; // alias de emEstoque
}
