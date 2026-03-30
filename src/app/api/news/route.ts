import { NextResponse } from 'next/server';
import localNews from '@/data/localNews.json';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lang = searchParams.get('lang') || 'it';

  let remoteNews: any[] = [];
  try {
    const res = await fetch(
      `http://www.viaggiatreno.it/infomobilita/resteasy/viaggiatreno/news/0/${lang}`,
      { next: { revalidate: 60 } } // Cache for 60 seconds
    );
    if (res.ok) {
      const text = await res.text();
      try {
        const data = JSON.parse(text);
        remoteNews = Array.isArray(data) ? data : [];
      } catch {
        // Plain text or invalid JSON
        if (text) remoteNews = [{ testo: text }];
      }
    }
  } catch (error) {
    console.error('Error fetching remote news:', error);
  }

  // Merge and return
  const combinedNews = [...localNews, ...remoteNews];
  return NextResponse.json(combinedNews);
}
