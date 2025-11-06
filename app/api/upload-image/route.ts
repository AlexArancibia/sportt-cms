import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.NEXT_PUBLIC_CLOUDFLARE_ENDPOINT,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_SECRET_KEY!,
  },
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const shopId = formData.get('shopId') as string;

    if (!file || !shopId) {
      return NextResponse.json({ success: false, error: 'Missing file or shopId' }, { status: 400 });
    }

    const fullFileName = `${shopId}/${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.CLOUDFLARE_BUCKET_NAME,
        Key: fullFileName,
        Body: buffer,
        ContentType: file.type,
      })
    );

    return NextResponse.json({
      success: true,
      fileUrl: `${process.env.NEXT_PUBLIC_IMAGE_DOMAIN}/${fullFileName}`,
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ success: false, error: 'Error uploading file' }, { status: 500 });
  }
}

