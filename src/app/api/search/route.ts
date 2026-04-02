import { NextResponse } from 'next/server';

async function getStationId(name: string): Promise<string | null> {
  try {
    const res = await fetch(`http://www.viaggiatreno.it/infomobilita/resteasy/viaggiatreno/autocompletaStazione/${encodeURIComponent(name)}`);
    if (!res.ok) return null;
    const text = await res.text();
    // Format: NAME|ID\nNAME|ID
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    if (lines.length === 0) return null;
    const firstMatch = lines[0].split('|');
    return firstMatch[1] || null;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  if (!from || !to) return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });

  try {
    const fromIdRaw = await getStationId(from);
    if (!fromIdRaw) return NextResponse.json({ error: `Not found: ${from}` }, { status: 404 });
    const fromIdNum = fromIdRaw.replace(/^S?0+/, '');

    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}:00`;

    // 1. Try Soluzioni API (Connections)
    try {
      const solUrl = `http://www.viaggiatreno.it/infomobilita/resteasy/viaggiatreno/soluzioniViaggioNew/${fromIdNum}/${(await getStationId(to))?.replace(/^S?0+/, '')}/${dateStr}`;
      console.log(`Trying Solutions: ${solUrl}`);
      const res = await fetch(solUrl);
      if (res.ok) {
        const data = await res.json();
        if (data.soluzioni && data.soluzioni.length > 0) {
          return NextResponse.json({
            from, to, type: 'solutions',
            solutions: data.soluzioni.slice(0, 3).map((sol: any) => ({
              durata: sol.durata,
              cambi: sol.vehicles.length - 1,
              legs: sol.vehicles.map((v: any) => ({
                numeroTreno: v.numeroTreno,
                categoria: v.categoriaDescrizione,
                origine: v.origine,
                destinazione: v.destinazione,
                partenza: v.orarioPartenza,
                arrivo: v.orarioArrivo
              }))
            }))
          });
        }
      }
    } catch (e) {
      console.log('Solutions API failed, falling back to departures...');
    }

    // 2. Fallback to Departures (Direct trains only)
    const depUrl = `http://www.viaggiatreno.it/infomobilita/resteasy/viaggiatreno/partenze/${fromIdRaw}/${encodeURIComponent(now.toString())}`;
    console.log(`Trying Departures: ${depUrl}`);
    const depRes = await fetch(depUrl);
    if (!depRes.ok) throw new Error('Departures API failed');

    const departures = await depRes.json();
    const normalizedTo = to.toLowerCase();
    const directResults = departures.filter((d: any) => 
      d.destinazione.toLowerCase().includes(normalizedTo) || normalizedTo.includes(d.destinazione.toLowerCase())
    ).map((d: any) => ({
      numeroTreno: d.numeroTreno,
      categoria: d.categoria,
      destinazione: d.destinazione,
      orarioPartenza: d.orarioPartenza
    }));

    return NextResponse.json({
      from, to, type: 'direct',
      trains: directResults.slice(0, 5)
    });

  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
