export interface Produto {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  precoOriginal?: number | null;
  imagem: string;
  categoria: string;
  subcategoria?: string;
  emEstoque: boolean;
  quantidadePacote: string; // ex: "500g", "Pack of 3"
  avaliacao: number;
  numAvaliacoes: number;
  tags: string[]; // ex: "orgânico", "sem glúten"
}

export interface Categoria {
  id: string;
  nome: string;
  icone: string; // URL da imagem ou classe de ícone
}

export interface ItemCarrinho {
  produto: Produto;
  quantidade: number;
}
