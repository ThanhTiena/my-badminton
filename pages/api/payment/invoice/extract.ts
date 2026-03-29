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
import { GoogleGenerativeAI } from '@google/generative-ai';

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
}

Please extract the invoice information from this image.`;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end();
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured' });
  }

  const { image } = req.body as { image?: string };
  if (!image || !image.startsWith('data:image/')) {
    return res.status(400).json({ error: '"image" must be a base64 data URL' });
  }

  // Strip the data URL prefix to get pure base64
  const [header, base64Data] = image.split(',');
  const mimeType = header.replace('data:', '').replace(';base64', '');

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const result = await model.generateContent([
      PROMPT,
      { inlineData: { data: base64Data, mimeType } },
    ]);

    const text = result.response.text();

    let parsed: unknown;
    try {
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
