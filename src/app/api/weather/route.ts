import { NextResponse } from 'next/server';

interface WeatherResult {
  source: string;
  temp: number;
  description: string;
  windspeed: number;
  icon: string;
  humidity?: number;
}

const WMO_DESCRIPTIONS: Record<number, { icon: string; label: Record<string, string> }> = {
  0: { icon: '☀️', label: {"en": "Clear sky", "it": "Sereno", "ro": "Cer senin", "fr": "Ciel dégagé", "es": "Despejado", "de": "Klarer Himmel", "ar": "سماء صافية", "sq": "Qiell i pastër", "uk": "Ясне небо", "zh": "晴空"} },
  1: { icon: '🌤️', label: {"en": "Mainly clear", "it": "Poco nuvoloso", "ro": "În mare parte senin", "fr": "Principalement dégagé", "es": "Mayormente despejado", "de": "Überwiegend klar", "ar": "صافي غالبا", "sq": "Kryesisht kthjellët", "uk": "Переважно ясно", "zh": "大部晴朗"} },
  2: { icon: '⛅', label: {"en": "Partly cloudy", "it": "Parzialmente nuvoloso", "ro": "Parțial noros", "fr": "Partiellement nuageux", "es": "Parcialmente nublado", "de": "Teilweise bewölkt", "ar": "غائم جزئيا", "sq": "Pjesërisht vranët", "uk": "Мінлива хмарність", "zh": "局部多云"} },
  3: { icon: '☁️', label: {"en": "Overcast", "it": "Coperto", "ro": "Înnorat", "fr": "Couvert", "es": "Nublado", "de": "Bedeckt", "ar": "غائم", "sq": "Vranët", "uk": "Похмуро", "zh": "阴天"} },
  45: { icon: '🌫️', label: {"en": "Foggy", "it": "Nebbia", "ro": "Ceață", "fr": "Brouillard", "es": "Niebla", "de": "Neblig", "ar": "ضبابي", "sq": "Mjegull", "uk": "Туман", "zh": "有雾"} },
  48: { icon: '🌫️', label: {"en": "Icy fog", "it": "Nebbia ghiacciata", "ro": "Ceață înghețată", "fr": "Brouillard givrant", "es": "Niebla helada", "de": "Eisnebel", "ar": "ضباب جليدي", "sq": "Mjegull e ngrirë", "uk": "Крижаний туман", "zh": "冰冻雾"} },
  51: { icon: '🌦️', label: {"en": "Light drizzle", "it": "Pioviggine leggera", "ro": "Burniță ușoară", "fr": "Bruine légère", "es": "Llovizna ligera", "de": "Leichter Nieselregen", "ar": "رذاذ خفيف", "sq": "Vesë e lehtë", "uk": "Легка мряка", "zh": "小毛毛雨"} },
  53: { icon: '🌦️', label: {"en": "Drizzle", "it": "Pioviggine", "ro": "Burniță", "fr": "Bruine", "es": "Llovizna", "de": "Nieselregen", "ar": "رذاذ", "sq": "Vesë", "uk": "Мряка", "zh": "毛毛雨"} },
  55: { icon: '🌧️', label: {"en": "Heavy drizzle", "it": "Pioviggine forte", "ro": "Burniță puternică", "fr": "Bruine forte", "es": "Llovizna fuerte", "de": "Starker Nieselregen", "ar": "رذاذ كثيف", "sq": "Vesë e fortë", "uk": "Густа мряка", "zh": "大毛毛雨"} },
  61: { icon: '🌧️', label: {"en": "Light rain", "it": "Pioggia leggera", "ro": "Ploaie ușoară", "fr": "Pluie légère", "es": "Lluvia ligera", "de": "Leichter Regen", "ar": "مطر خفيف", "sq": "Shi i lehtë", "uk": "Легкий дощ", "zh": "小雨"} },
  63: { icon: '🌧️', label: {"en": "Rain", "it": "Pioggia", "ro": "Ploaie", "fr": "Pluie", "es": "Lluvia", "de": "Regen", "ar": "مطر", "sq": "Shi", "uk": "Дощ", "zh": "雨"} },
  65: { icon: '🌧️', label: {"en": "Heavy rain", "it": "Pioggia forte", "ro": "Ploaie puternică", "fr": "Forte pluie", "es": "Fuerte lluvia", "de": "Starker Regen", "ar": "مطر غزير", "sq": "Shi i fortë", "uk": "Сильний дощ", "zh": "大雨"} },
  71: { icon: '🌨️', label: {"en": "Light snow", "it": "Neve leggera", "ro": "Ninsoare ușoară", "fr": "Neige légère", "es": "Nieve ligera", "de": "Leichter Schneefall", "ar": "ثلج خفيف", "sq": "Borë e lehtë", "uk": "Слабкий сніг", "zh": "小雪"} },
  73: { icon: '❄️', label: {"en": "Snow", "it": "Neve", "ro": "Ninsoare", "fr": "Neige", "es": "Nieve", "de": "Schnee", "ar": "ثلج", "sq": "Borë", "uk": "Сніг", "zh": "雪"} },
  75: { icon: '❄️', label: {"en": "Heavy snow", "it": "Neve forte", "ro": "Ninsoare puternică", "fr": "Forte neige", "es": "Nieve fuerte", "de": "Starker Schneefall", "ar": "ثلج كثيف", "sq": "Borë e fortë", "uk": "Сильний сніг", "zh": "大雪"} },
  80: { icon: '🌦️', label: {"en": "Rain showers", "it": "Rovesci di pioggia", "ro": "Averse de ploaie", "fr": "Averses de pluie", "es": "Chubascos de lluvia", "de": "Regenschauer", "ar": "زخات مطر", "sq": "Rrebesh shiu", "uk": "Зливи", "zh": "阵雨"} },
  81: { icon: '🌦️', label: {"en": "Rain showers", "it": "Rovesci di pioggia", "ro": "Averse de ploaie", "fr": "Averses de pluie", "es": "Chubascos de lluvia", "de": "Regenschauer", "ar": "زخات مطر", "sq": "Rrebesh shiu", "uk": "Зливи", "zh": "阵雨"} },
  82: { icon: '⛈️', label: {"en": "Violent showers", "it": "Rovesci violenti", "ro": "Averse violente", "fr": "Averses violentes", "es": "Chubascos violentos", "de": "Heftige Schauer", "ar": "زخات عنيفة", "sq": "Rrebesh i dhunshëm", "uk": "Сильні зливи", "zh": "猛烈阵雨"} },
  95: { icon: '⛈️', label: {"en": "Thunderstorm", "it": "Temporale", "ro": "Furtună", "fr": "Orage", "es": "Tormenta", "de": "Gewitter", "ar": "عاصفة رعدية", "sq": "Stuhi", "uk": "Гроза", "zh": "雷暴"} },
  96: { icon: '⛈️', label: {"en": "Thunderstorm", "it": "Temporale", "ro": "Furtună", "fr": "Orage", "es": "Tormenta", "de": "Gewitter", "ar": "عاصفة رعدية", "sq": "Stuhi", "uk": "Гроза", "zh": "雷暴"} },
  99: { icon: '⛈️', label: {"en": "Thunderstorm", "it": "Temporale", "ro": "Furtună", "fr": "Orage", "es": "Tormenta", "de": "Gewitter", "ar": "عاصفة رعدية", "sq": "Stuhi", "uk": "Гроза", "zh": "雷暴"} }
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

async function fetchOpenMeteo(lang: string): Promise<WeatherResult | null> {
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
    const meta = WMO_DESCRIPTIONS[wmoCode] ?? { label: {"en": "Unknown"}, icon: '🌡️' };

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
      description: meta.label[lang] || meta.label['en'] || "Unknown",
      windspeed: Math.round(cw.windspeed * 10) / 10,
      icon: meta.icon,
      humidity,
    };
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lang = searchParams.get('lang') || 'en';

  // Try primary source first
  const vtResult = await fetchViaggiaTreno();
  if (vtResult) {
    return NextResponse.json(vtResult, {
      headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=60' },
    });
  }

  // Fallback to Open-Meteo
  const omResult = await fetchOpenMeteo(lang);
  if (omResult) {
    return NextResponse.json(omResult, {
      headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=60' },
    });
  }

  return NextResponse.json({ error: 'Weather data unavailable' }, { status: 503 });
}
