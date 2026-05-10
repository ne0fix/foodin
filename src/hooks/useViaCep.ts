import { useState } from 'react';

interface ViaCepResponse {
  logradouro: string;
  bairro: string;
  localidade: string;  // cidade
  uf: string;
  erro?: boolean;
}

export function useViaCep() {
  const [buscando, setBuscando] = useState(false);
  const [erroCep, setErroCep] = useState('');

  const buscar = async (cep: string): Promise<ViaCepResponse | null> => {
    const limpo = cep.replace(/\D/g, '');
    if (limpo.length !== 8) return null;

    setBuscando(true);
    setErroCep('');

    try {
      const res = await fetch(`https://viacep.com.br/ws/${limpo}/json/`);
      const data: ViaCepResponse = await res.json();

      if (data.erro) {
        setErroCep('CEP não encontrado. Verifique e tente novamente.');
        return null;
      }
      return data;
    } catch {
      setErroCep('Erro ao buscar CEP. Verifique sua conexão.');
      return null;
    } finally {
      setBuscando(false);
    }
  };

  return { buscar, buscando, erroCep, setErroCep };
}
