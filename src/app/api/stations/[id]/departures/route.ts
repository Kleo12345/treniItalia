import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const now = new Date();
  const dateStr = encodeURIComponent(now.toString());

  try {
    const res = await fetch(
      `http://www.viaggiatreno.it/infomobilita/resteasy/viaggiatreno/partenze/${id}/${dateStr}`
    );
    if (!res.ok) throw new Error(`Trenitalia API error: ${res.status}`);

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching departures:', error);
    return NextResponse.json({ error: 'Failed to fetch departures' }, { status: 500 });
  }
}
