/**
 * POST /api/payment/invoice/extract
 *
 * Body: { image: string }  — base64 data URL  (e.g. "data:image/jpeg;base64,...")
 *
 * Uses a local Ollama vision model (no API key, no cost).
 * Install: https://ollama.com  then run: ollama pull llava
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

const OLLAMA_URL = process.env.OLLAMA_URL ?? 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? 'llava';
const OLLAMA_TOKEN = process.env.OLLAMA_TOKEN ?? '';

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

  const { image } = req.body as { image?: string };
  if (!image || !image.startsWith('data:image/')) {
    return res.status(400).json({ error: '"image" must be a base64 data URL' });
  }

  // Strip data URL prefix → pure base64
  const base64Data = image.split(',')[1];

  try {
    const ollamaRes = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(OLLAMA_TOKEN ? { Authorization: `Bearer ${OLLAMA_TOKEN}` } : {}),
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: PROMPT,
        images: [base64Data],
        stream: false,
      }),
    });

    if (!ollamaRes.ok) {
      const errText = await ollamaRes.text();
      if (ollamaRes.status === 404) {
        return res.status(502).json({
          error: `Ollama model "${OLLAMA_MODEL}" not found. Run: ollama pull ${OLLAMA_MODEL}`,
        });
      }
      return res.status(502).json({ error: `Ollama error: ${errText}` });
    }

    const data = await ollamaRes.json() as { response?: string; error?: string };

    if (data.error) {
      return res.status(502).json({ error: data.error });
    }

    const text = data.response ?? '';

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
    if (msg.includes('ECONNREFUSED') || msg.includes('fetch failed')) {
      return res.status(502).json({
        error: 'Ollama is not running. Start it with: ollama serve',
      });
    }
    return res.status(502).json({ error: msg });
  }
}
