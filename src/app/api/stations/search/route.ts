import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');

  if (!q) {
    return NextResponse.json({ error: 'Missing query parameter q' }, { status: 400 });
  }

  try {
    const res = await fetch(`http://www.viaggiatreno.it/infomobilita/resteasy/viaggiatreno/autocompletaStazione/${encodeURIComponent(q)}`);
    if (!res.ok) {
      throw new Error(`Trenitalia API error: ${res.status}`);
    }
    
    const text = await res.text();
    // Format: NAME|ID\nNAME|ID
    const stations = text.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => {
        const [name, id] = line.split('|');
        return { name, id };
      });
      
    return NextResponse.json(stations);
  } catch (error) {
    console.error('Error fetching stations:', error);
    return NextResponse.json({ error: 'Failed to fetch stations' }, { status: 500 });
  }
}
