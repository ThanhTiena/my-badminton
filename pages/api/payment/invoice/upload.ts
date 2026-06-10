// POST /api/payment/invoice/upload
// Body: { image: string, filename?: string } (image is base64 data URL)
// Requires: admin JWT cookie

export const config = { api: { bodyParser: { sizeLimit: '20mb' } } };

import type { NextApiRequest, NextApiResponse } from 'next';
import { put } from '@vercel/blob';
import { requireAdmin } from '@/lib/auth/middleware';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end();
  }

  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const { image, filename } = req.body as { image?: string; filename?: string };
  if (!image) {
    return res.status(400).json({ error: '"image" base64 is required.' });
  }

  try {
    let base64Data = image;
    let contentType = 'image/jpeg';

    if (image.startsWith('data:')) {
      const match = image.match(/^data:([^;]+);base64,(.+)$/);
      if (!match) {
        return res.status(400).json({ error: 'Invalid base64 data URL format.' });
      }
      contentType = match[1];
      base64Data = match[2];
    }

    const buffer = Buffer.from(base64Data, 'base64');
    let ext = 'jpg';
    if (contentType.includes('png')) ext = 'png';
    else if (contentType.includes('webp')) ext = 'webp';
    else if (contentType.includes('gif')) ext = 'gif';

    const cleanFilename = filename || `invoice-${Date.now()}.${ext}`;

    const blob = await put(cleanFilename, buffer, {
      access: 'public',
      contentType,
    });

    return res.status(200).json({ url: blob.url });
  } catch (err) {
    console.error('[/api/payment/invoice/upload]', err);
    return res.status(500).json({ error: 'Failed to upload image to Vercel Blob.' });
  }
}
