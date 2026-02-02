'use client';

import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useShopSettings } from '@/hooks/useShopSettings';
import { uploadImage } from '@/app/actions/upload-file';

export default function ImageUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<{ url?: string; error?: string } | null>(null);

  const currentStoreId = useAuthStore((s) => s.currentStoreId);
  const { data: shopSettings } = useShopSettings(currentStoreId);
  const shopId = shopSettings?.name || 'default-shop';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Iniciando el envío del formulario...');

    if (!file) {
      console.error('Error: No se seleccionó ningún archivo.');
      return;
    }

    setIsUploading(true);

    try {
      console.log('Obteniendo presigned URL...');
      const { success, presignedUrl, fileUrl, error } = await uploadImage(
        shopId,
        file.name,
        file.type
      );

      if (!success || !presignedUrl) {
        console.error('Error al obtener la presigned URL:', error);
        setResult({ error: error || 'Error generating presigned URL' });
        return;
      }

      console.log('Subiendo archivo directamente a R2...');
      const uploadResponse = await fetch(presignedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) {
        console.error('Error subiendo el archivo:', uploadResponse.statusText);
        setResult({ error: 'Error uploading file' });
        return;
      }

      console.log('Archivo subido correctamente.');
      setResult({ url: fileUrl });
    } catch (error) {
      console.error('Error en el manejo del formulario:', error);
      setResult({ error: 'Error uploading file' });
    } finally {
      console.log('Finalizando el proceso de subida...');
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 border rounded-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const selectedFile = e.target.files?.[0] || null;
            console.log('Archivo seleccionado:', selectedFile);
            setFile(selectedFile);
          }}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        
        <button
          type="submit"
          disabled={isUploading || !file}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isUploading ? 'Uploading...' : 'Upload Image'}
        </button>
      </form>

      {result?.url && (
        <div className="mt-4 p-4 bg-green-50 rounded-md">
          <p className="text-green-600">Upload successful!</p>
          <a
            href={result.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline mt-2 inline-block"
          >
            View uploaded image
          </a>
        </div>
      )}

      {result?.error && (
        <div className="mt-4 p-4 bg-red-50 rounded-md">
          <p className="text-red-600">{result.error}</p>
        </div>
      )}
    </div>
  );
}