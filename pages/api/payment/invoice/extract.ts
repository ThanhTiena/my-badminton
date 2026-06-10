/**
 * POST /api/payment/invoice/extract
 *
 * Body: { image: string }  — base64 data URL  (e.g. "data:image/jpeg;base64,...")
 *
 * Rate-limit aware: server-side enforces ≥1 s between Mistral calls (queue).
 * Client retries automatically on 429 with exponential backoff.
 */
export const config = { api: { bodyParser: { sizeLimit: '20mb' } } };

import type { NextApiRequest, NextApiResponse } from 'next';
import { Mistral } from '@mistralai/mistralai';
import { requireAdmin } from '@/lib/auth/middleware';

const PROMPT = `You are an expert at reading Vietnamese badminton court invoices.
The image may contain ONE invoice or MULTIPLE invoices side by side / stacked.

Extract billing information and return ONLY valid JSON — no markdown, no prose.

Step 1 — Count how many separate invoices are visible in the image.
Step 2 — For EACH invoice, extract its data independently.
Step 3 — Return a JSON array where each element represents one invoice.

Extraction rules (apply per invoice):
- "Tiền sân" / "thuê sân" / "sân cầu" → courtFee
- "Cầu" / "quả cầu" / "cầu lông" + số lượng → numShuttlecocks + shuttlecockUnitPrice
  If only total shuttlecock cost is listed (no count×price), put it in shuttlecockTotal and leave count/price null.
- Everything else (nước, nước suối, đồ uống, băng dán, v.v.) → extraItems[]
- All prices in VND (numbers only, no "đ" or ",").
- If a field cannot be found, use null.
- "invoiceIndex": sequential number starting from 1 (left-to-right, top-to-bottom order).

Return this exact JSON shape — always an array, even for a single invoice:
[
  {
    "invoiceIndex": 1,
    "courtFee": <number|null>,
    "numShuttlecocks": <number|null>,
    "shuttlecockUnitPrice": <number|null>,
    "shuttlecockTotal": <number|null>,
    "extraItems": [ { "name": "<Vietnamese name>", "price": <number> } ],
    "rawText": "<full text you read from this invoice>"
  }
]`;

/* ─── Server-side rate-limit queue (1 req/s) ─────────────────────────────── */
// Module-level state persists across requests in the same Node process.
let lastCallAt = 0;           // timestamp of last Mistral call
let pending = false;          // a call is in-flight
const RATE_MS = 1100;         // 1.1 s between calls (slight buffer over 1 s limit)
const MAX_WAIT_MS = 15_000;   // refuse to queue longer than 15 s

function waitForSlot(): Promise<void> {
  return new Promise((resolve, reject) => {
    const trySlot = () => {
      if (pending) {
        // Another request is already running; wait and retry
        const waited = Date.now() - (lastCallAt - RATE_MS);
        if (waited > MAX_WAIT_MS) return reject(new Error('Rate-limit queue timeout'));
        setTimeout(trySlot, 200);
        return;
      }
      const now = Date.now();
      const gap = now - lastCallAt;
      if (gap >= RATE_MS) {
        pending = true;
        lastCallAt = now;
        resolve();
      } else {
        setTimeout(trySlot, RATE_MS - gap);
      }
    };
    trySlot();
  });
}

/* ─── Helper: call Mistral with up to 3 retries on 429 ───────────────────── */
async function callMistral(image: string): Promise<string> {
  const client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY! });
  const MAX_RETRIES = 3;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const result = await client.chat.complete({
        model: 'ministral-8b-latest',
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
      return Array.isArray(text)
        ? text.map((c: { type: string; text?: string }) => c.type === 'text' ? c.text ?? '' : '').join('')
        : String(text);

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const is429 = msg.includes('429') || msg.toLowerCase().includes('too many requests');

      if (is429 && attempt < MAX_RETRIES - 1) {
        // Exponential backoff: 2 s, 4 s, 8 s
        const delay = 2000 * Math.pow(2, attempt);
        await new Promise(r => setTimeout(r, delay));
        lastCallAt = Date.now(); // push the next allowed slot forward
        continue;
      }
      throw err;
    }
  }
  throw new Error('Max retries exceeded');
}

/* ─── Robust JSON parser — handles all model output variations ───────────── */
function parseAIResponse(raw: string): unknown[] {
  let text = raw.trim();

  // 1. Strip markdown code fences  ```json ... ``` or ``` ... ```
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

  // 2. Double-serialized: model returned a JSON string e.g. "[ ... ]"
  if (text.startsWith('"') && text.endsWith('"')) {
    try { text = JSON.parse(text) as string; } catch { /* keep as-is */ }
    text = text.trim();
  }

  // 3. Try direct parse first (fast path — covers most cases)
  try {
    const direct = JSON.parse(text);
    return Array.isArray(direct) ? direct : [direct];
  } catch { /* fall through to repair */ }

  // 4. Extract the outermost [...] or {...} block
  //    Walk character-by-character to find balanced brackets,
  //    which avoids greedy regex mis-matching on nested brackets.
  const extract = (open: string, close: string): string | null => {
    const start = text.indexOf(open);
    if (start === -1) return null;
    let depth = 0;
    for (let i = start; i < text.length; i++) {
      if (text[i] === open)  depth++;
      if (text[i] === close) depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
    return null;
  };

  const arrayBlock = extract('[', ']');
  const objBlock   = extract('{', '}');
  // Prefer array; fall back to object
  const block = arrayBlock ?? objBlock;
  if (!block) throw new Error('No JSON structure found in response');

  // 5. Repair common model mistakes inside the block:
  //    a) Unescaped newlines/tabs inside string values
  //    b) Trailing commas before } or ]
  //    c) Single-quoted strings → double-quoted
  const repaired = block
    // replace literal newline/tab/CR inside JSON strings with escape sequences
    .replace(/("(?:[^"\\]|\\.)*")|(\n)|(\r)|(\t)/g, (match, str, nl, cr, tab) => {
      if (str) return str;          // inside a string — keep as-is (already valid)
      if (nl)  return '';           // bare newline outside string — remove
      if (cr)  return '';           // bare CR outside string — remove
      if (tab) return '';           // bare tab outside string — remove
      return match;
    })
    // fix unescaped newlines *inside* string values specifically
    .replace(/"((?:[^"\\]|\\.)*)"/g, (_m, content: string) =>
      '"' + content.replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t') + '"'
    )
    // remove trailing commas
    .replace(/,\s*([}\]])/g, '$1');

  try {
    const result = JSON.parse(repaired);
    return Array.isArray(result) ? result : [result];
  } catch {
    throw new Error('JSON repair failed');
  }
}

/* ─── Handler ────────────────────────────────────────────────────────────── */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end();
  }

  const admin = await requireAdmin(req, res);
  if (!admin) return;

  if (!process.env.MISTRAL_API_KEY) {
    return res.status(500).json({ error: 'MISTRAL_API_KEY is not configured' });
  }

  const { image } = req.body as { image?: string };
  if (!image || !image.startsWith('data:image/')) {
    return res.status(400).json({ error: '"image" must be a base64 data URL' });
  }

  try {
    // Wait for a free rate-limit slot before calling the API
    await waitForSlot();

    let text: string;
    try {
      text = await callMistral(image);
    } finally {
      pending = false; // always release the slot
    }

    let parsed: unknown;
    try {
      parsed = parseAIResponse(text);
    } catch {
      return res.status(502).json({ error: 'Failed to parse AI response', raw: text });
    }

    return res.status(200).json(parsed);

  } catch (err: unknown) {
    pending = false;
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('queue timeout')) {
      return res.status(429).json({ error: 'Server busy — too many scan requests, please try again in a moment.' });
    }
    return res.status(502).json({ error: msg });
  }
}
