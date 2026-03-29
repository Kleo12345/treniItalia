import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ number: string }> }
) {
  const { number } = await params;

  try {
    // First, find the origin station for this train number
    const autoRes = await fetch(
      `http://www.viaggiatreno.it/infomobilita/resteasy/viaggiatreno/cercaNumeroTrenoTrenoAutocomplete/${number}`
    );
    if (!autoRes.ok) throw new Error(`Trenitalia autocomplete error: ${autoRes.status}`);

    const autoText = await autoRes.text();
    // Format: "NUMBER - STATION_NAME|NUMBER-STATION_CODE\n"
    const firstLine = autoText.split('\n').find(l => l.trim().length > 0);
    if (!firstLine) {
      return NextResponse.json({ error: 'Train not found' }, { status: 404 });
    }

    const pipeIndex = firstLine.indexOf('|');
    if (pipeIndex === -1) {
      return NextResponse.json({ error: 'Invalid response format' }, { status: 500 });
    }

    const codePart = firstLine.substring(pipeIndex + 1); // e.g. "9551-S01700-1774738800000"
    // Format: NUMBER-STATION_CODE-DEPARTURE_TIMESTAMP
    const segments = codePart.split('-');
    // segments[0] = train number, segments[1] = station code, segments[2] = timestamp
    if (segments.length < 3) {
      return NextResponse.json({ error: 'Invalid response format' }, { status: 500 });
    }
    const originCode = segments[1]; // e.g. "S01700"
    const dateParam = segments[2];  // e.g. "1774738800000"

    const routeRes = await fetch(
      `http://www.viaggiatreno.it/infomobilita/resteasy/viaggiatreno/andamentoTreno/${originCode}/${number}/${dateParam}`
    );
    if (!routeRes.ok) throw new Error(`Trenitalia route error: ${routeRes.status}`);

    const data = await routeRes.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching train route:', error);
    return NextResponse.json({ error: 'Failed to fetch train route' }, { status: 500 });
  }
}
