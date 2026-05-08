'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ProdutoCreateSchema } from '@/src/utils/validators';
import { useCategoriasViewModel } from '@/src/viewmodels/categorias.vm';
import TagSelector from './TagSelector';
import ImageUpload from './ImageUpload';
import Toggle from './ui/Toggle';
import { useRouter } from 'next/navigation';

type FormValues = z.output<typeof ProdutoCreateSchema>;

interface Props {
  defaultValues?: Partial<FormValues>;
  onSubmit: (data: FormValues) => Promise<void>;
  isSubmitting: boolean;
}

const input = 'mt-1 block w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500';
const label = 'block text-sm font-medium text-gray-700 mb-1';
const err = 'mt-1 text-xs text-red-500';

export default function ProdutoForm({ defaultValues, onSubmit, isSubmitting }: Props) {
  const router = useRouter();
  const { categorias, carregando: loadingCategorias } = useCategoriasViewModel();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(ProdutoCreateSchema) as never,
    defaultValues: { emEstoque: true, tags: [], ...defaultValues },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Informações básicas */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5">
        <h2 className="text-base font-bold text-gray-900">Informações básicas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className={label}>Nome do produto</label>
            <input {...register('nome')} className={input} />
            {errors.nome && <p className={err}>{errors.nome.message}</p>}
          </div>
          <div>
            <label className={label}>Categoria</label>
            <select {...register('categoriaId')} className={input} disabled={loadingCategorias}>
              <option value="">{loadingCategorias ? 'Carregando...' : 'Selecione...'}</option>
              {categorias.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
            {errors.categoriaId && <p className={err}>{errors.categoriaId.message}</p>}
          </div>
          <div className="sm:col-span-2">
            <label className={label}>Descrição</label>
            <textarea {...register('descricao')} rows={3} className={input} />
            {errors.descricao && <p className={err}>{errors.descricao.message}</p>}
          </div>
          <div>
            <label className={label}>Qtde. / Embalagem (ex: 500g, por kg)</label>
            <input {...register('quantidadePacote')} className={input} />
            {errors.quantidadePacote && <p className={err}>{errors.quantidadePacote.message}</p>}
          </div>
        </div>
      </div>

      {/* Preço e estoque */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5">
        <h2 className="text-base font-bold text-gray-900">Preço e estoque</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className={label}>Preço atual (R$)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              {...register('preco', { valueAsNumber: true })}
              className={input}
            />
            {errors.preco && <p className={err}>{errors.preco.message}</p>}
          </div>
          <div>
            <label className={label}>Preço original — opcional (cria badge de desconto)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              {...register('precoOriginal', { valueAsNumber: true, setValueAs: (v) => (v === '' || isNaN(v) ? null : Number(v)) })}
              className={input}
            />
            {errors.precoOriginal && <p className={err}>{errors.precoOriginal.message}</p>}
          </div>
          <div className="sm:col-span-2">
            <Controller
              name="emEstoque"
              control={control}
              render={({ field }) => (
                <Toggle label="Produto disponível em estoque" checked={!!field.value} onChange={field.onChange} />
              )}
            />
          </div>
        </div>
      </div>

      {/* Mídia e tags */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5">
        <h2 className="text-base font-bold text-gray-900">Imagem e tags</h2>
        <Controller
          name="imagem"
          control={control}
          render={({ field }) => <ImageUpload value={field.value} onChange={field.onChange} />}
        />
        {errors.imagem && <p className={err}>{errors.imagem.message}</p>}
        <Controller
          name="tags"
          control={control}
          render={({ field }) => <TagSelector value={field.value ?? []} onChange={field.onChange} />}
        />
      </div>

      {/* Ações */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-5 py-2.5 text-sm font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Salvando...' : 'Salvar Produto'}
        </button>
      </div>
    </form>
  );
}
