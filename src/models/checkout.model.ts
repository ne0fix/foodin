export interface DadosComprador {
  nome: string;
  email: string;
  cpf?: string;       // obrigatório apenas para cartão; PIX não exige
  telefone: string;   // apenas dígitos "11999999999"
}

export interface DadosEntrega {
  tipo: 'ENTREGA' | 'RETIRADA';
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
}

export interface ItemCheckout {
  produtoId: string;
  quantidade: number;
}

export interface CheckoutIniciarPayload {
  itens: ItemCheckout[];
  comprador: DadosComprador;
  entrega: DadosEntrega;
  metodo: 'PIX' | 'CARTAO';
  frete: number;
  // Cartão apenas — todos vindos do CardPayment Brick do MP:
  cardToken?: string;
  parcelas?: number;
  issuerId?: string;
  paymentMethodId?: string; // "visa", "master", "amex", etc.
}

export interface CheckoutIniciarResponse {
  orderId: string;
  metodo: 'PIX' | 'CARTAO';
  status: string;
  // PIX:
  qrCode?: string;
  qrCodeBase64?: string;
  expiresAt?: string;
  // Cartão:
  statusDetail?: string;
}

export interface FreteResponse {
  logradouro: string;
  bairro: string;
  cidade: string;
  uf: string;
  frete: number;
  freteGratis: boolean;
}
