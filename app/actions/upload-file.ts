'use server';

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.NEXT_PUBLIC_CLOUDFLARE_ENDPOINT,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_SECRET_KEY!,
  },
});

export async function uploadImage(shopId: string, fileName: string, fileType: string) {
  console.log('Iniciando la función uploadImage...');
  console.log('shopId recibido:', shopId);
  console.log('fileName recibido:', fileName);
  console.log('fileType recibido:', fileType);

  try {
    // Genera el nombre del archivo con el shopId
    const fullFileName = `${shopId}/${Date.now()}-${fileName.replace(/\s+/g, '-')}`;
    console.log('Nombre completo del archivo generado:', fullFileName);

    // Crea el comando PutObjectCommand
    const command = new PutObjectCommand({
      Bucket: process.env.CLOUDFLARE_BUCKET_NAME,
      Key: fullFileName,
      ContentType: fileType,
    });

    console.log('Generando presigned URL...');
    const presignedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 }); // Expira en 1 hora
    console.log('Presigned URL generada:', presignedUrl);

    return {
      success: true,
      presignedUrl,
      fileUrl: `${process.env.NEXT_PUBLIC_IMAGE_DOMAIN}/${fullFileName}`,
    };
  } catch (error) {
    console.error('Error durante la generación de la presigned URL:', error);
    return { success: false, error: 'Error generating presigned URL' };
  }
}