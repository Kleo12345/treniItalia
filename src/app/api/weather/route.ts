import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await fetch(
      'http://www.viaggiatreno.it/infomobilita/resteasy/viaggiatreno/datimeteo/0'
    );
    if (!res.ok) throw new Error(`Trenitalia weather error: ${res.status}`);

    const text = await res.text();
    try {
      const data = JSON.parse(text);
      return NextResponse.json(data);
    } catch {
      return NextResponse.json({ raw: text });
    }
  } catch (error) {
    console.error('Error fetching weather:', error);
    return NextResponse.json({ error: 'Failed to fetch weather' }, { status: 500 });
  }
}
