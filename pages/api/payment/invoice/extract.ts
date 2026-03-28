/**
 * POST /api/payment/invoice/extract
 *
 * Body: { image: string }  — base64 data URL  (e.g. "data:image/jpeg;base64,...")
 *
 * Response:
 * {
 *   courtFee:            number | null;
 *   numShuttlecocks:     number | null;
 *   shuttlecockUnitPrice: number | null;
 *   shuttlecockTotal:    number | null;   // if only total is listed (not count×price)
 *   extraItems:          { name: string; price: number }[];
 *   rawText:             string;          // full OCR text for user verification
 * }
 */
export const config = { api: { bodyParser: { sizeLimit: '20mb' } } };

import type { NextApiRequest, NextApiResponse } from 'next';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are an expert at reading Vietnamese badminton court invoices.
Extract billing information and return ONLY valid JSON — no markdown, no prose.

Rules:
- "Tiền sân" / "thuê sân" / "sân cầu" → courtFee
- "Cầu" / "quả cầu" / "cầu lông" + số lượng → numShuttlecocks + shuttlecockUnitPrice
  If only total shuttlecock cost is listed (no count×price), put it in shuttlecockTotal and leave count/price null.
- Everything else (nước, nước suối, đồ uống, băng dán, v.v.) → extraItems[]
- All prices in VND (numbers only, no "đ" or ",").
- If a field cannot be found, use null.

Return this exact JSON shape:
{
  "courtFee": <number|null>,
  "numShuttlecocks": <number|null>,
  "shuttlecockUnitPrice": <number|null>,
  "shuttlecockTotal": <number|null>,
  "extraItems": [ { "name": "<Vietnamese name>", "price": <number> } ],
  "rawText": "<full text you read from the invoice>"
}`;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end();
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not configured' });
  }

  const { image } = req.body as { image?: string };
  if (!image || !image.startsWith('data:image/')) {
    return res.status(400).json({ error: '"image" must be a base64 data URL' });
  }

  // Strip the data URL prefix to get pure base64
  const [header, base64Data] = image.split(',');
  const mediaType = header.replace('data:', '').replace(';base64', '') as
    'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';

  try {
    const message = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: base64Data },
            },
            {
              type: 'text',
              text: 'Please extract the invoice information from this image.',
            },
          ],
        },
      ],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';

    // Parse JSON — Claude should return pure JSON per the system prompt
    let parsed: unknown;
    try {
      // Strip any accidental markdown code fences
      const cleaned = text.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
      parsed = JSON.parse(cleaned);
    } catch {
      return res.status(502).json({ error: 'Failed to parse AI response', raw: text });
    }

    return res.status(200).json(parsed);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(502).json({ error: msg });
  }
}
