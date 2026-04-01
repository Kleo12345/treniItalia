import { NextRequest, NextResponse } from 'next/server';

// Rate limit: max 20 requests per IP per minute (simple in-memory store)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 20) return false;
  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  // Rate limiting
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Rate limit exceeded. Try again later.' }, { status: 429 });
  }

  let body: { token?: unknown; chatId?: unknown; message?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { token, chatId, message } = body;

  // Strict input validation
  if (
    typeof token !== 'string' ||
    typeof chatId !== 'string' ||
    typeof message !== 'string'
  ) {
    return NextResponse.json({ error: 'Missing or invalid fields: token, chatId, message must be strings.' }, { status: 400 });
  }

  // Validate token format: digits:alphanum (e.g. 123456789:ABCdef...)
  if (!/^\d{6,12}:[A-Za-z0-9_-]{30,50}$/.test(token)) {
    return NextResponse.json({ error: 'Invalid bot token format.' }, { status: 400 });
  }

  // Validate chatId format: optional minus + digits
  if (!/^-?\d{1,20}$/.test(chatId)) {
    return NextResponse.json({ error: 'Invalid chat ID format.' }, { status: 400 });
  }

  // Sanitize and limit message length
  const sanitizedMessage = message.slice(0, 1000);

  try {
    const telegramUrl = `https://api.telegram.org/bot${token}/sendMessage`;
    const telegramRes = await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: sanitizedMessage,
        parse_mode: 'HTML',
      }),
    });

    const data = await telegramRes.json();

    if (!telegramRes.ok || !data.ok) {
      // Don't forward Telegram's raw error to avoid leaking internal info
      const description: string = typeof data?.description === 'string' ? data.description : 'Unknown Telegram error';
      return NextResponse.json({ error: `Telegram error: ${description}` }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Failed to contact Telegram.' }, { status: 502 });
  }
}
