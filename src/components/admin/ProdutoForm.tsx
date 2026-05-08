'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ProdutoCreateSchema, ProdutoFormData } from '@/src/utils/validators';
import { useCategoriasViewModel } from '@/src/viewmodels/categorias.vm';
import { TagSelector } from './TagSelector';
import { ImageUpload } from './ImageUpload';
import Toggle from './ui/Toggle';
import { useRouter } from 'next/navigation';

interface ProdutoFormProps {
    defaultValues?: Partial<ProdutoFormData>;
    onSubmit: (data: ProdutoFormData) => Promise<void>;
    isSubmitting: boolean;
}

const formInputClass = "mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm";
const formLabelClass = "block text-sm font-medium text-gray-700";
const errorMessageClass = "mt-1 text-sm text-red-600";

export function ProdutoForm({ defaultValues, onSubmit, isSubmitting }: ProdutoFormProps) {
    const router = useRouter();
    const { categorias, carregando: loadingCategorias } = useCategoriasViewModel();

    const { register, handleSubmit, control, formState: { errors } } = useForm<ProdutoFormData>({
        resolver: zodResolver(ProdutoCreateSchema),
        defaultValues: defaultValues,
    });
    
    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="p-8 bg-white rounded-lg shadow-sm border">
                <h2 className="text-lg font-semibold mb-6">Informações Básicas</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="nome" className={formLabelClass}>Nome do Produto</label>
                        <input id="nome" {...register('nome')} className={formInputClass} />
                        {errors.nome && <p className={errorMessageClass}>{errors.nome.message}</p>}
                    </div>
                    <div>
                        <label htmlFor="categoriaId" className={formLabelClass}>Categoria</label>
                        <select id="categoriaId" {...register('categoriaId')} className={formInputClass} disabled={loadingCategorias}>
                             <option value="">{loadingCategorias ? 'Carregando...' : 'Selecione...'}</option>
                             {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                        </select>
                        {errors.categoriaId && <p className={errorMessageClass}>{errors.categoriaId.message}</p>}
                    </div>
                    <div className="md:col-span-2">
                        <label htmlFor="descricao" className={formLabelClass}>Descrição</label>
                        <textarea id="descricao" {...register('descricao')} rows={4} className={formInputClass} />
                        {errors.descricao && <p className={errorMessageClass}>{errors.descricao.message}</p>}
                    </div>
                     <div>
                        <label htmlFor="quantidadePacote" className={formLabelClass}>Qtde. Pacote (ex: 500g, 1L)</label>
                        <input id="quantidadePacote" {...register('quantidadePacote')} className={formInputClass} />
                        {errors.quantidadePacote && <p className={errorMessageClass}>{errors.quantidadePacote.message}</p>}
                    </div>
                </div>
            </div>

             <div className="p-8 bg-white rounded-lg shadow-sm border">
                <h2 className="text-lg font-semibold mb-6">Preço e Estoque</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="preco" className={formLabelClass}>Preço (R$)</label>
                        <input id="preco" type="number" step="0.01" {...register('preco')} className={formInputClass} />
                        {errors.preco && <p className={errorMessageClass}>{errors.preco.message}</p>}
                    </div>
                     <div>
                        <label htmlFor="precoOriginal" className={formLabelClass}>Preço Original (Opcional)</label>
                        <input id="precoOriginal" type="number" step="0.01" {...register('precoOriginal')} className={formInputClass} />
                        {errors.precoOriginal && <p className={errorMessageClass}>{errors.precoOriginal.message}</p>}
                    </div>
                    <div className="md:col-span-2 pt-4">
                         <Controller
                            name="emEstoque"
                            control={control}
                            defaultValue={true}
                            render={({ field }) => <Toggle label="Produto disponível em estoque" checked={field.value} onChange={field.onChange} />}
                        />
                    </div>
                </div>
            </div>

            <div className="p-8 bg-white rounded-lg shadow-sm border">
                <h2 className="text-lg font-semibold mb-6">Mídia e Tags</h2>
                 <div className="md:col-span-2">
                    <Controller
                        name="imagem"
                        control={control}
                        defaultValue={defaultValues?.imagem || ''}
                        render={({ field }) => (
                            <ImageUpload 
                                value={field.value}
                                onChange={field.onChange}
                            />
                        )}
                    />
                    {errors.imagem && <p className={errorMessageClass}>{errors.imagem.message}</p>}
                 </div>

                 <div className="mt-6 md:col-span-2">
                     <Controller
                        name="tags"
                        control={control}
                        defaultValue={[]}
                        render={({ field }) => <TagSelector value={field.value || []} onChange={field.onChange} />}
                    />
                 </div>
            </div>
            
            <div className="flex justify-end gap-4 mt-8">
                <button type="button" onClick={() => router.back()} className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
                    Cancelar
                </button>
                <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50">
                    {isSubmitting ? 'Salvando...' : 'Salvar Produto'}
                </button>
            </div>
        </form>
    );
}
