import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lang = searchParams.get('lang') || 'it';

  try {
    const res = await fetch(
      `http://www.viaggiatreno.it/infomobilita/resteasy/viaggiatreno/news/0/${lang}`
    );
    if (!res.ok) throw new Error(`Trenitalia news error: ${res.status}`);

    const text = await res.text();
    try {
      const data = JSON.parse(text);
      return NextResponse.json(data);
    } catch {
      // Sometimes returns plain text
      return NextResponse.json({ raw: text });
    }
  } catch (error) {
    console.error('Error fetching news:', error);
    return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 });
  }
}
