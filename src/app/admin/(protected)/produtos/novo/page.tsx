'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ProdutoForm from '@/src/components/admin/ProdutoForm';
import { ProdutoFormData } from '@/src/utils/validators';

export default function NovoProdutoPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (data: ProdutoFormData) => {
        setIsSubmitting(true);
        setError(null);
        try {
            const response = await fetch('/api/admin/produtos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Falha ao criar o produto.');
            }

            router.push('/admin/produtos');
            // router.refresh() is useful if you want to ensure the list on the previous page is updated.
            router.refresh(); 

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Adicionar Novo Produto</h1>
            {error && <p className="text-red-500 bg-red-100 p-4 rounded-md">{error}</p>}
            <ProdutoForm 
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
            />
        </div>
    );
}
