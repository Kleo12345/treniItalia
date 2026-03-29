import { NextResponse } from 'next/server';

export async function GET() {
  const now = Date.now();

  try {
    const res = await fetch(
      `http://www.viaggiatreno.it/infomobilita/resteasy/viaggiatreno/statistiche/${now}`
    );
    if (!res.ok) throw new Error(`Trenitalia stats error: ${res.status}`);

    const text = await res.text();
    try {
      const data = JSON.parse(text);
      return NextResponse.json(data);
    } catch {
      return NextResponse.json({ raw: text });
    }
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
