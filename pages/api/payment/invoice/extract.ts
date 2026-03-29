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
 *   shuttlecockTotal:    number | null;
 *   extraItems:          { name: string; price: number }[];
 *   rawText:             string;
 * }
 */
export const config = { api: { bodyParser: { sizeLimit: '20mb' } } };

import type { NextApiRequest, NextApiResponse } from 'next';
import { Mistral } from '@mistralai/mistralai';

const PROMPT = `You are an expert at reading Vietnamese badminton court invoices.
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

  if (!process.env.MISTRAL_API_KEY) {
    return res.status(500).json({ error: 'MISTRAL_API_KEY is not configured' });
  }

  const { image } = req.body as { image?: string };
  if (!image || !image.startsWith('data:image/')) {
    return res.status(400).json({ error: '"image" must be a base64 data URL' });
  }

  try {
    const client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY });

    const result = await client.chat.complete({
      model: 'pixtral-12b-2409',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image_url', imageUrl: { url: image } },
            { type: 'text', text: PROMPT },
          ],
        },
      ],
    });

    const text = result.choices?.[0]?.message?.content ?? '';
    const textStr = Array.isArray(text)
      ? text.map((c: { type: string; text?: string }) => c.type === 'text' ? c.text : '').join('')
      : String(text);

    let parsed: unknown;
    try {
      const cleaned = textStr.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
      parsed = JSON.parse(cleaned);
    } catch {
      return res.status(502).json({ error: 'Failed to parse AI response', raw: textStr });
    }

    return res.status(200).json(parsed);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(502).json({ error: msg });
  }
}
