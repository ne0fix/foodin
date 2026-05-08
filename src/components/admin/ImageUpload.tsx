'use client';

import { useState, useRef, ChangeEvent } from 'react';
import Image from 'next/image';
import { UploadCloud, X } from 'lucide-react';

interface ImageUploadProps {
  value: string | undefined;
  onChange: (url: string) => void;
}

export function ImageUpload({ value, onChange }: ImageUploadProps) {
  const inputFileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/upload?filename=${file.name}`, {
        method: 'POST',
        body: file,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Falha no upload da imagem.');
      }

      const newBlob = await response.json();
      onChange(newBlob.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido durante o upload.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    onChange('');
  };

  return (
    <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Imagem do Produto</label>
        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
            {value ? (
                <div className="relative group w-48 h-48">
                    <Image src={value} alt="Preview do produto" layout="fill" className="rounded-md object-cover" />
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-md">
                        <button 
                            type="button" 
                            onClick={handleRemoveImage}
                            className="text-white p-2 bg-red-600 rounded-full hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                            title="Remover Imagem"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-1 text-center">
                    <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                        <label
                            htmlFor="file-upload"
                            className="relative cursor-pointer bg-white rounded-md font-medium text-green-600 hover:text-green-500 focus-within:outline-none"
                        >
                            <span>Selecione um arquivo</span>
                            <input ref={inputFileRef} id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/*" disabled={uploading} />
                        </label>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF até 4.5MB</p>
                </div>
            )}
        </div>
        {uploading && (
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-green-600 h-2.5 rounded-full animate-pulse" style={{width: '100%'}}></div>
            </div>
        )}
        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </div>
  );
}

export default ImageUpload;
