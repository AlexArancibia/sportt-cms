# Proceso de Guardado de Imágenes con Cloudflare R2

Este documento describe el proceso completo de subida y almacenamiento de imágenes utilizando Cloudflare R2 (almacenamiento de objetos compatible con S3) en el sistema CMS.

## Tabla de Contenidos

1. [Configuración Inicial](#configuración-inicial)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Métodos de Subida](#métodos-de-subida)
4. [Flujos de Trabajo](#flujos-de-trabajo)
5. [Componentes y Hooks](#componentes-y-hooks)
6. [Estructura de Archivos](#estructura-de-archivos)
7. [Variables de Entorno](#variables-de-entorno)
8. [Ejemplos de Uso](#ejemplos-de-uso)
9. [Manejo de Errores](#manejo-de-errores)

---

## Configuración Inicial

### Requisitos Previos

- Cuenta de Cloudflare con R2 habilitado
- Bucket de R2 configurado
- Credenciales de acceso (Access Key ID y Secret Access Key)
- Endpoint de R2 configurado

### Dependencias

El sistema utiliza el SDK de AWS para interactuar con R2 (compatible con S3):

```json
{
  "@aws-sdk/client-s3": "^3.x.x",
  "@aws-sdk/s3-request-presigner": "^3.x.x"
}
```

---

## Arquitectura del Sistema

El sistema implementa dos métodos principales para subir imágenes a R2:

### 1. Método con Presigned URLs (Recomendado)
El cliente solicita una URL firmada temporalmente al servidor y luego sube directamente el archivo a R2.

**Ventajas:**
- Menor carga en el servidor de Next.js
- Subida directa desde el cliente a R2
- Mejor rendimiento para archivos grandes
- Escalable

### 2. Método con API Route
El cliente envía el archivo al servidor Next.js, que lo sube a R2.

**Ventajas:**
- Procesamiento adicional del archivo en el servidor
- Validaciones más estrictas en el servidor
- Útil para transformaciones de imágenes

---

## Métodos de Subida

### Método 1: Presigned URLs (Flujo Principal)

#### Archivo: `app/actions/upload-file.ts`

Esta es una Server Action de Next.js que genera una presigned URL para subir el archivo directamente a R2.

```typescript
export async function uploadImage(shopId: string, fileName: string, fileType: string)
```

**Proceso:**

1. **Configuración del Cliente S3:**
   ```typescript
   const s3 = new S3Client({
     region: 'auto',
     endpoint: process.env.NEXT_PUBLIC_CLOUDFLARE_ENDPOINT,
     forcePathStyle: true,
     credentials: {
       accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID!,
       secretAccessKey: process.env.CLOUDFLARE_SECRET_KEY!,
     },
   });
   ```

2. **Generación del Nombre de Archivo:**
   - Formato: `${shopId}/${Date.now()}-${fileName.replace(/\s+/g, '-')}`
   - Ejemplo: `tienda-1/1704123456789-imagen-producto.jpg`
   - Los espacios se reemplazan por guiones
   - Se añade un timestamp para evitar colisiones

3. **Creación del Comando PutObject:**
   ```typescript
   const command = new PutObjectCommand({
     Bucket: process.env.CLOUDFLARE_BUCKET_NAME,
     Key: fullFileName,
     ContentType: fileType,
   });
   ```

4. **Generación de Presigned URL:**
   - Duración: 3600 segundos (1 hora)
   - La URL permite subir el archivo directamente a R2 sin exponer las credenciales

5. **Retorno:**
   ```typescript
   return {
     success: true,
     presignedUrl,  // URL para subir el archivo
     fileUrl: `${process.env.NEXT_PUBLIC_IMAGE_DOMAIN}/${fullFileName}`,  // URL final de la imagen
   };
   ```

#### Flujo en el Cliente:

1. Usuario selecciona un archivo
2. Componente llama a `uploadImage()` para obtener presigned URL
3. Componente hace `PUT` request directamente a la presigned URL con el archivo
4. R2 almacena el archivo
5. Se obtiene la URL final de la imagen

**Ejemplo de Uso en Componente:**

```typescript
const { success, presignedUrl, fileUrl, error } = await uploadImage(
  shopId,
  file.name,
  file.type
);

if (!success || !presignedUrl) {
  // Manejar error
  return;
}

// Subir archivo directamente a R2
const uploadResponse = await fetch(presignedUrl, {
  method: 'PUT',
  body: file,
  headers: {
    'Content-Type': file.type,
  },
});

if (!uploadResponse.ok) {
  // Manejar error de subida
  return;
}

// fileUrl contiene la URL final de la imagen
```

---

### Método 2: API Route (Alternativo)

#### Archivo: `app/api/upload-image/route.ts`

Este endpoint recibe el archivo en el servidor y lo sube directamente a R2.

**Proceso:**

1. **Recibe FormData:**
   ```typescript
   const formData = await request.formData();
   const file = formData.get('file') as File;
   const shopId = formData.get('shopId') as string;
   ```

2. **Validación:**
   - Verifica que exista el archivo y el shopId
   - Retorna error 400 si falta alguno

3. **Procesamiento del Archivo:**
   ```typescript
   const fullFileName = `${shopId}/${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
   const buffer = Buffer.from(await file.arrayBuffer());
   ```

4. **Subida a R2:**
   ```typescript
   await s3.send(
     new PutObjectCommand({
       Bucket: process.env.CLOUDFLARE_BUCKET_NAME,
       Key: fullFileName,
       Body: buffer,
       ContentType: file.type,
     })
   );
   ```

5. **Retorno:**
   ```typescript
   return NextResponse.json({
     success: true,
     fileUrl: `${process.env.NEXT_PUBLIC_IMAGE_DOMAIN}/${fullFileName}`,
   });
   ```

#### Helper Function: `lib/imageUpload.ts`

Función wrapper que facilita el uso del método de API Route:

```typescript
export async function uploadImageToR2(file: File, shopId: string)
```

**Uso:**
```typescript
const { success, fileUrl, error } = await uploadImageToR2(file, shopId);
```

---

## Flujos de Trabajo

### Flujo 1: Subida de Imagen Única (Productos)

```
Usuario selecciona archivo
    ↓
Componente (ImageGallery, MediaUpload, etc.)
    ↓
Llama a uploadImage() para obtener presigned URL
    ↓
Hace PUT request a presigned URL con el archivo
    ↓
R2 almacena el archivo
    ↓
Se obtiene fileUrl final
    ↓
Se actualiza el estado del componente/formulario
```

**Archivos Relacionados:**
- `app/(dashboard)/products/_hooks/useProductImageUpload.ts`
- `app/(dashboard)/products/(singleProduct)/_components/MediaUpload.tsx`
- `app/(dashboard)/products/(singleProduct)/_components/ImageGallery.tsx`

### Flujo 2: Procesamiento de Múltiples Imágenes (Importación)

```
Producto con array de imageUrls externas
    ↓
processProductImages() itera sobre cada URL
    ↓
Para cada URL:
  - Descarga la imagen desde la URL externa
  - Convierte a File object
  - Obtiene presigned URL
  - Sube a R2
  - Reemplaza URL externa con URL de R2
    ↓
Retorna producto con URLs actualizadas
```

**Archivo Relacionado:**
- `lib/imageUploader.tsx` - función `processProductImages()`

### Flujo 3: Subida con Hook Personalizado

```
Componente utiliza useImageUpload()
    ↓
Usuario selecciona archivo(s)
    ↓
Hook valida archivo (tamaño, tipo)
    ↓
Llama a uploadImageToR2() (API Route method)
    ↓
Muestra notificaciones toast
    ↓
Ejecuta callbacks onSuccess/onError
```

**Archivo Relacionado:**
- `hooks/use-image-upload.ts`

---

## Componentes y Hooks

### Hooks

#### 1. `useProductImageUpload`

**Ubicación:** `app/(dashboard)/products/_hooks/useProductImageUpload.ts`

**Propósito:** Hook específico para subida de imágenes de productos.

**Funciones:**
- `uploadSingleImage(file, maxImages, currentImagesCount)`: Sube una sola imagen
- `handleImageUpload(onSuccess, maxImages, currentImagesCount)`: Trigger para selección de archivo

**Características:**
- Valida límite de imágenes (máximo por defecto: 10)
- Usa método de presigned URLs
- Muestra toasts de éxito/error
- Retorna la URL final de la imagen

**Uso:**
```typescript
const imageUpload = useProductImageUpload(currentStore);

imageUpload.handleImageUpload((fileUrl) => {
  // Agregar fileUrl a la galería
  setGalleryImages([...galleryImages, fileUrl]);
}, 10, galleryImages.length);
```

#### 2. `useImageUpload`

**Ubicación:** `hooks/use-image-upload.ts`

**Propósito:** Hook genérico para subida de imágenes con más opciones.

**Características:**
- Validación de archivo (tamaño, tipo)
- Soporte para múltiples archivos
- Progress tracking (simulado)
- Callbacks personalizados (onSuccess, onError, onProgress)
- Configuración de opciones (maxFileSize, allowedTypes)

**Opciones:**
```typescript
interface UploadOptions {
  shopId?: string
  onSuccess?: (fileUrl: string, file: File) => void
  onError?: (error: string) => void
  onProgress?: (progress: number) => void
  maxFileSize?: number // en MB (default: 10MB)
  allowedTypes?: string[] // (default: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
}
```

**Uso:**
```typescript
const { uploadSingleImage, uploadMultipleImages, triggerFileSelect, isUploading } = useImageUpload({
  maxFileSize: 5,
  onSuccess: (url) => console.log('Imagen subida:', url),
  onError: (error) => console.error('Error:', error),
});

// Subir una imagen
await uploadSingleImage(file);

// Trigger selección de archivo
triggerFileSelect({ multiple: true });
```

### Componentes

#### 1. `R2ImageUpload`

**Ubicación:** `components/R2ImageUpload.tsx`

**Propósito:** Componente de ejemplo/demostración para subir imágenes.

**Características:**
- Input de tipo file
- Muestra estado de carga
- Muestra resultado (URL o error)
- Usa método de presigned URLs
- Obtiene shopId desde el store global

#### 2. `ImageGallery`

**Ubicación:** `app/(dashboard)/products/(singleProduct)/_components/ImageGallery.tsx`

**Propósito:** Galería de imágenes para productos con capacidad de agregar/eliminar.

**Características:**
- Muestra imágenes existentes
- Permite agregar nuevas imágenes (hasta un máximo)
- Permite eliminar imágenes
- Preview de imágenes antes de subir
- Manejo de errores visual

#### 3. `MediaUploadSection`

**Ubicación:** `app/(dashboard)/products/(singleProduct)/_components/MediaUpload.tsx`

**Propósito:** Sección completa para manejo de medios (imagen de portada + galería).

**Características:**
- Separación entre imagen de portada y galería
- Subida independiente para cada tipo
- Preview de imágenes
- Usa método de presigned URLs

---

## Estructura de Archivos

```
app/
├── actions/
│   └── upload-file.ts              # Server action para presigned URLs
├── api/
│   └── upload-image/
│       └── route.ts                # API route para subida directa
components/
├── R2ImageUpload.tsx               # Componente de ejemplo
├── ImageUpload.tsx                 # Componente básico de subida
hooks/
└── use-image-upload.ts             # Hook genérico para subida
lib/
├── imageUpload.ts                  # Helper para API route method
└── imageUploader.tsx               # Utilidades para procesamiento de imágenes
app/(dashboard)/products/
├── _hooks/
│   └── useProductImageUpload.ts    # Hook específico para productos
└── (singleProduct)/_components/
    ├── ImageGallery.tsx            # Componente de galería
    └── MediaUpload.tsx             # Sección completa de medios
```

---

## Variables de Entorno

### Requeridas

Las siguientes variables de entorno deben estar configuradas en `.env.local`:

```env
# Cloudflare R2 - Endpoint Público (para presigned URLs)
NEXT_PUBLIC_CLOUDFLARE_ENDPOINT=https://[account-id].r2.cloudflarestorage.com

# Cloudflare R2 - Credenciales (solo en servidor)
CLOUDFLARE_ACCESS_KEY_ID=tu_access_key_id
CLOUDFLARE_SECRET_KEY=tu_secret_access_key

# Cloudflare R2 - Nombre del Bucket
CLOUDFLARE_BUCKET_NAME=nombre-del-bucket

# Dominio de Imágenes (para construir URLs finales)
NEXT_PUBLIC_IMAGE_DOMAIN=https://cdn.tudominio.com
# O si usas custom domain de R2:
# NEXT_PUBLIC_IMAGE_DOMAIN=https://r2.tudominio.com
```

### Configuración de R2

1. **Crear Bucket en Cloudflare R2**
   - Ir a Cloudflare Dashboard → R2
   - Crear un nuevo bucket
   - Configurar permisos de acceso público si es necesario

2. **Configurar Custom Domain (Opcional pero Recomendado)**
   - Configurar un dominio personalizado para el bucket
   - Esto permite servir imágenes con tu propio dominio
   - Configurar CORS si es necesario

3. **Crear API Token**
   - Ir a R2 → Manage R2 API Tokens
   - Crear token con permisos de lectura/escritura
   - Guardar Access Key ID y Secret Access Key de forma segura

4. **Configurar CORS (si es necesario)**
   ```json
   [
     {
       "AllowedOrigins": ["https://tudominio.com"],
       "AllowedMethods": ["GET", "PUT", "POST"],
       "AllowedHeaders": ["*"],
       "ExposeHeaders": ["ETag"],
       "MaxAgeSeconds": 3000
     }
   ]
   ```

---

## Ejemplos de Uso

### Ejemplo 1: Subida Simple con Presigned URL

```typescript
import { uploadImage } from '@/app/actions/upload-file';

const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const shopId = 'tienda-1';

  // Obtener presigned URL
  const { success, presignedUrl, fileUrl, error } = await uploadImage(
    shopId,
    file.name,
    file.type
  );

  if (!success || !presignedUrl) {
    console.error('Error:', error);
    return;
  }

  // Subir archivo a R2
  const uploadResponse = await fetch(presignedUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type,
    },
  });

  if (!uploadResponse.ok) {
    console.error('Error subiendo archivo');
    return;
  }

  console.log('Imagen subida:', fileUrl);
};
```

### Ejemplo 2: Usando Hook useImageUpload

```typescript
import { useImageUpload } from '@/hooks/use-image-upload';

function MyComponent() {
  const { uploadSingleImage, isUploading } = useImageUpload({
    maxFileSize: 5, // 5MB
    onSuccess: (url) => {
      console.log('Imagen subida:', url);
      // Actualizar estado o hacer algo con la URL
    },
    onError: (error) => {
      console.error('Error:', error);
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadSingleImage(file);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={isUploading}
      />
      {isUploading && <p>Subiendo...</p>}
    </div>
  );
}
```

### Ejemplo 3: Usando API Route Method

```typescript
import { uploadImageToR2 } from '@/lib/imageUpload';

const handleUpload = async (file: File) => {
  const shopId = 'tienda-1';
  const { success, fileUrl, error } = await uploadImageToR2(file, shopId);

  if (success && fileUrl) {
    console.log('Imagen subida:', fileUrl);
  } else {
    console.error('Error:', error);
  }
};
```

### Ejemplo 4: Procesamiento de Múltiples URLs

```typescript
import { processProductImages } from '@/lib/imageUploader';

const processProduct = async (product: Product) => {
  const shopId = 'tienda-1';

  // Procesar todas las imágenes del producto
  const processedProduct = await processProductImages(product, shopId);

  // processedProduct ahora tiene todas las URLs actualizadas a R2
  console.log('Producto procesado:', processedProduct);
};
```

---

## Manejo de Errores

### Errores Comunes y Soluciones

#### 1. Error: "Missing file or shopId"
**Causa:** No se proporcionó el archivo o el shopId en la solicitud.
**Solución:** Asegurarse de que ambos parámetros estén presentes antes de llamar a la función.

#### 2. Error: "Error generating presigned URL"
**Causa:** 
- Variables de entorno incorrectas
- Credenciales inválidas
- Problema de conexión con R2

**Solución:**
- Verificar variables de entorno
- Verificar credenciales de R2
- Verificar conectividad con el endpoint

#### 3. Error: "Error uploading file" (403 Forbidden)
**Causa:** 
- Presigned URL expirada (más de 1 hora)
- Permisos insuficientes del token de R2
- CORS no configurado correctamente

**Solución:**
- Regenerar presigned URL si expiró
- Verificar permisos del API token
- Configurar CORS en el bucket de R2

#### 4. Error: "El archivo es muy grande"
**Causa:** El archivo excede el límite máximo configurado.
**Solución:** Validar tamaño antes de subir o aumentar el límite.

#### 5. Error: "Tipo de archivo no permitido"
**Causa:** El archivo no es una imagen o no está en la lista de tipos permitidos.
**Solución:** Validar tipo de archivo antes de subir.

### Mejores Prácticas para Manejo de Errores

1. **Validación en el Cliente:**
   ```typescript
   const validateFile = (file: File) => {
     const maxSize = 10 * 1024 * 1024; // 10MB
     const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

     if (file.size > maxSize) {
       return { valid: false, error: 'Archivo muy grande' };
     }

     if (!allowedTypes.includes(file.type)) {
       return { valid: false, error: 'Tipo de archivo no permitido' };
     }

     return { valid: true };
   };
   ```

2. **Manejo de Errores con Try-Catch:**
   ```typescript
   try {
     const result = await uploadImage(shopId, fileName, fileType);
     if (!result.success) {
       // Manejar error específico
       handleError(result.error);
     }
   } catch (error) {
     // Manejar error inesperado
     console.error('Error inesperado:', error);
   }
   ```

3. **Feedback Visual al Usuario:**
   - Mostrar estados de carga
   - Mostrar mensajes de error claros
   - Permitir reintentar la subida
   - Mostrar progreso cuando sea posible

---

## Consideraciones Adicionales

### Seguridad

1. **Nunca exponer credenciales en el cliente:**
   - Las credenciales solo deben estar en variables de servidor
   - Usar presigned URLs para subidas directas desde el cliente

2. **Validación de Tipos de Archivo:**
   - Validar tanto en cliente como en servidor
   - No confiar solo en la extensión del archivo

3. **Límites de Tamaño:**
   - Configurar límites apropiados según el uso
   - Considerar compresión de imágenes antes de subir

4. **Sanitización de Nombres de Archivo:**
   - El sistema ya sanitiza nombres (reemplaza espacios)
   - Considerar validación adicional si es necesario

### Optimización

1. **Compresión de Imágenes:**
   - Considerar comprimir imágenes antes de subir
   - Usar formatos modernos (WebP, AVIF) cuando sea posible

2. **Lazy Loading:**
   - Implementar lazy loading para imágenes en galerías
   - Usar placeholders mientras cargan

3. **CDN:**
   - R2 actúa como CDN cuando se configura correctamente
   - Considerar Cloudflare Images para transformaciones automáticas

### Estructura de Carpetas en R2

El sistema organiza las imágenes por `shopId`:

```
bucket-r2/
├── tienda-1/
│   ├── 1704123456789-producto-1.jpg
│   ├── 1704123456790-producto-2.png
│   └── 1704123456791-portada.jpg
├── tienda-2/
│   ├── 1704123456792-categoria.jpg
│   └── 1704123456793-hero.png
└── ...
```

**Ventajas:**
- Organización clara por tienda
- Fácil de mantener y respaldar
- Permite políticas de acceso por carpeta

---

## Resumen

El sistema de guardado de imágenes con R2 utiliza dos métodos principales:

1. **Presigned URLs (Recomendado):** Subida directa desde cliente a R2, mejor rendimiento
2. **API Route:** Subida a través del servidor Next.js, útil para procesamiento adicional

**Componentes clave:**
- `uploadImage()` - Server action para presigned URLs
- `uploadImageToR2()` - Helper para API route method
- `useImageUpload()` - Hook genérico con validaciones
- `useProductImageUpload()` - Hook específico para productos

**Flujos principales:**
- Subida de imagen única para productos
- Procesamiento masivo de imágenes externas
- Subida con hooks personalizados

El sistema está diseñado para ser escalable, seguro y fácil de usar, con validaciones apropiadas y manejo de errores robusto.


