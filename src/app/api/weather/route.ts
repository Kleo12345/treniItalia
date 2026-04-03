import { NextResponse } from 'next/server';

interface WeatherResult {
  source: string;
  temp: number;
  description: string;
  windspeed: number;
  icon: string;
  humidity?: number;
}

const WMO_DESCRIPTIONS: Record<number, { label: string; icon: string }> = {
  0:  { label: 'Clear sky', icon: '☀️' },
  1:  { label: 'Mainly clear', icon: '🌤️' },
  2:  { label: 'Partly cloudy', icon: '⛅' },
  3:  { label: 'Overcast', icon: '☁️' },
  45: { label: 'Foggy', icon: '🌫️' },
  48: { label: 'Icy fog', icon: '🌫️' },
  51: { label: 'Light drizzle', icon: '🌦️' },
  53: { label: 'Drizzle', icon: '🌦️' },
  55: { label: 'Heavy drizzle', icon: '🌧️' },
  61: { label: 'Light rain', icon: '🌧️' },
  63: { label: 'Rain', icon: '🌧️' },
  65: { label: 'Heavy rain', icon: '🌧️' },
  71: { label: 'Light snow', icon: '🌨️' },
  73: { label: 'Snow', icon: '❄️' },
  75: { label: 'Heavy snow', icon: '❄️' },
  80: { label: 'Rain showers', icon: '🌦️' },
  81: { label: 'Rain showers', icon: '🌦️' },
  82: { label: 'Violent showers', icon: '⛈️' },
  95: { label: 'Thunderstorm', icon: '⛈️' },
  96: { label: 'Thunderstorm', icon: '⛈️' },
  99: { label: 'Thunderstorm', icon: '⛈️' },
};

async function fetchViaggiaTreno(): Promise<WeatherResult | null> {
  try {
    const res = await fetch(
      'http://www.viaggiatreno.it/infomobilita/resteasy/viaggiatreno/datimeteo/0',
      { signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) return null;

    const text = await res.text();
    const data = JSON.parse(text);

    // datimeteo returns an array of weather station objects
    const stations: Array<Record<string, unknown>> = Array.isArray(data) ? data : (data?.list ?? []);
    if (!stations.length) return null;

    // Pick first station with valid temp data
    const station = stations.find(
      (s) => typeof s.temperatura === 'number' || typeof s.temperatura === 'string'
    ) ?? stations[0];

    const temp = parseFloat(String(station.temperatura ?? station.temp ?? 0));
    const windspeed = parseFloat(String(station.vento ?? station.windspeed ?? 0));
    const desc = String(station.descrizione ?? station.description ?? 'N/A');
    const icon = desc.toLowerCase().includes('piog') ? '🌧️'
               : desc.toLowerCase().includes('neve') ? '❄️'
               : desc.toLowerCase().includes('sole') ? '☀️'
               : desc.toLowerCase().includes('nuvo') ? '⛅'
               : '🌡️';

    return { source: 'ViaggiaTreno', temp, description: desc, windspeed, icon };
  } catch {
    return null;
  }
}

async function fetchOpenMeteo(): Promise<WeatherResult | null> {
  try {
    const res = await fetch(
      'https://api.open-meteo.com/v1/forecast?latitude=41.9028&longitude=12.4964&current_weather=true&hourly=relativehumidity_2m&timezone=Europe%2FRome&forecast_days=1',
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return null;

    const data = await res.json();
    const cw = data?.current_weather;
    if (!cw) return null;

    const wmoCode: number = cw.weathercode ?? 0;
    const meta = WMO_DESCRIPTIONS[wmoCode] ?? { label: 'Unknown', icon: '🌡️' };

    // Get current hour humidity if available
    let humidity: number | undefined;
    try {
      const now = new Date();
      const hourIndex = now.getHours();
      humidity = data?.hourly?.relativehumidity_2m?.[hourIndex];
    } catch { /* noop */ }

    return {
      source: 'Open-Meteo',
      temp: Math.round(cw.temperature * 10) / 10,
      description: meta.label,
      windspeed: Math.round(cw.windspeed * 10) / 10,
      icon: meta.icon,
      humidity,
    };
  } catch {
    return null;
  }
}

export async function GET() {
  // Try primary source first
  const vtResult = await fetchViaggiaTreno();
  if (vtResult) {
    return NextResponse.json(vtResult, {
      headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=60' },
    });
  }

  // Fallback to Open-Meteo
  const omResult = await fetchOpenMeteo();
  if (omResult) {
    return NextResponse.json(omResult, {
      headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=60' },
    });
  }

  return NextResponse.json({ error: 'Weather data unavailable' }, { status: 503 });
}
