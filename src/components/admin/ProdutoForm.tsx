'use client';

import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ProdutoCreateSchema } from '@/src/utils/validators';
import { useState, useEffect } from 'react';
import TagSelector from './TagSelector';
import ImageUpload from './ImageUpload';
import Toggle from './ui/Toggle';
import { useRouter } from 'next/navigation';
import { Plus, Trash2 } from 'lucide-react';

type FormValues = z.output<typeof ProdutoCreateSchema>;

interface Props {
  defaultValues?: Partial<FormValues>;
  onSubmit: (data: FormValues) => Promise<void>;
  isSubmitting: boolean;
}

const input = 'mt-1 block w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500';
const label = 'block text-sm font-medium text-gray-700 mb-1';
const err = 'mt-1 text-xs text-red-500';

const MAX_EXTRA_IMAGES = 4;

interface CategoriaAdmin { id: string; nome: string; ativo: boolean }

export default function ProdutoForm({ defaultValues, onSubmit, isSubmitting }: Props) {
  const router = useRouter();
  const [categorias, setCategorias] = useState<CategoriaAdmin[]>([]);
  const [loadingCategorias, setLoadingCategorias] = useState(true);

  useEffect(() => {
    fetch('/api/admin/categorias')
      .then(r => r.json())
      .then((cats: CategoriaAdmin[]) => setCategorias(cats.filter(c => c.ativo)))
      .catch(() => {})
      .finally(() => setLoadingCategorias(false));
  }, []);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(ProdutoCreateSchema) as never,
    defaultValues: { emEstoque: true, tags: [], imagens: [], ...defaultValues },
  });

  const imagens = useWatch({ control, name: 'imagens' }) ?? [];

  const addImageSlot = () => {
    if (imagens.length < MAX_EXTRA_IMAGES) {
      setValue('imagens', [...imagens, '']);
    }
  };

  const removeImageSlot = (index: number) => {
    setValue('imagens', imagens.filter((_, i) => i !== index));
  };

  const updateImage = (index: number, url: string) => {
    const next = [...imagens];
    next[index] = url;
    setValue('imagens', next);
  };

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
            <input type="number" step="0.01" min="0"
              {...register('preco', { valueAsNumber: true })} className={input} />
            {errors.preco && <p className={err}>{errors.preco.message}</p>}
          </div>
          <div>
            <label className={label}>Preço original — opcional (cria badge de desconto)</label>
            <input type="number" step="0.01" min="0"
              {...register('precoOriginal', { valueAsNumber: true, setValueAs: (v) => (v === '' || isNaN(v) ? null : Number(v)) })}
              className={input} />
            {errors.precoOriginal && <p className={err}>{errors.precoOriginal.message}</p>}
          </div>
          <div>
            <label className={label}>Quantidade em estoque</label>
            <p className="text-xs text-gray-400 mb-1">
              Use <strong>-1</strong> para ilimitado (sem rastreamento). Número positivo ativa o controle automático.
            </p>
            <input
              type="number"
              min="-1"
              step="1"
              {...register('estoqueQuantidade', { valueAsNumber: true })}
              className={input}
            />
            {errors.estoqueQuantidade && <p className={err}>{errors.estoqueQuantidade.message}</p>}
          </div>
          <div className="sm:col-span-2">
            <Controller name="emEstoque" control={control}
              render={({ field }) => (
                <Toggle label="Produto disponível em estoque" checked={!!field.value} onChange={field.onChange} />
              )} />
          </div>
        </div>
      </div>

      {/* Imagem principal + galeria */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-6">
        <h2 className="text-base font-bold text-gray-900">Imagem e tags</h2>

        {/* Imagem principal */}
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">Imagem principal <span className="text-red-500">*</span></p>
          <Controller name="imagem" control={control}
            render={({ field }) => <ImageUpload value={field.value} onChange={field.onChange} />} />
          {errors.imagem && <p className={err}>{errors.imagem.message}</p>}
        </div>

        {/* Imagens adicionais */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-gray-700">Imagens adicionais</p>
              <p className="text-xs text-gray-400">{imagens.length} de {MAX_EXTRA_IMAGES} — exibidas como miniaturas na página do produto</p>
            </div>
            {imagens.length < MAX_EXTRA_IMAGES && (
              <button type="button" onClick={addImageSlot}
                className="flex items-center gap-1.5 text-sm font-semibold text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg transition-colors">
                <Plus size={15} /> Adicionar imagem
              </button>
            )}
          </div>

          {imagens.length === 0 ? (
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center text-gray-400 text-sm">
              Nenhuma imagem adicional. Clique em "Adicionar imagem" para incluir até {MAX_EXTRA_IMAGES}.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {imagens.map((url, i) => (
                <div key={i} className="relative">
                  <p className="text-xs font-medium text-gray-500 mb-1">Miniatura {i + 1}</p>
                  <ImageUpload
                    value={url}
                    onChange={(newUrl) => updateImage(i, newUrl)}
                  />
                  <button type="button" onClick={() => removeImageSlot(i)}
                    className="absolute top-0 right-0 flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-medium">
                    <Trash2 size={13} /> Remover
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tags */}
        <Controller name="tags" control={control}
          render={({ field }) => <TagSelector value={field.value ?? []} onChange={field.onChange} />} />
      </div>

      {/* Ações */}
      <div className="flex justify-end gap-3">
        <button type="button" onClick={() => router.back()}
          className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
          Cancelar
        </button>
        <button type="submit" disabled={isSubmitting}
          className="px-5 py-2.5 text-sm font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50">
          {isSubmitting ? 'Salvando...' : 'Salvar Produto'}
        </button>
      </div>
    </form>
  );
}
