'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useEntregador } from '@/src/hooks/useEntregador';
import dynamic from 'next/dynamic';

const MapaEntrega = dynamic(() => import('./MapaEntrega'), { ssr: false });

interface PedidoEndereco {
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  cep: string | null;
}

function montarEndereco(p: PedidoEndereco): string {
  return [p.logradouro, p.numero, p.bairro, p.cidade, p.uf, p.cep]
    .filter(Boolean)
    .join(', ');
}

export default function MapaPage() {
  const { id } = useParams<{ id: string }>();
  const { entregador, loading: loadingAuth } = useEntregador();
  const [endereco, setEndereco] = useState<string | null>(null);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    if (!entregador) return;
    fetch(`/api/entregador/pedidos/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) setEndereco(montarEndereco(data));
        else setErro(true);
      })
      .catch(() => setErro(true));
  }, [id, entregador]);

  if (loadingAuth || (!endereco && !erro)) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#e84010', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  if (erro || !endereco) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-gray-400">Pedido não encontrado</p>
      </div>
    );
  }

  return <MapaEntrega enderecoDestino={endereco} pedidoId={id} />;
}
