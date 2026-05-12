'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface EntregadorData {
  id: string;
  nome: string;
  telefone: string;
}

export function useEntregador() {
  const [entregador, setEntregador] = useState<EntregadorData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/entregador/me')
      .then(r => {
        if (r.status === 401) {
          router.replace('/entregador/login');
          return null;
        }
        return r.json();
      })
      .then(data => {
        if (data) setEntregador(data);
      })
      .finally(() => setLoading(false));
  }, [router]);

  return { entregador, loading };
}
