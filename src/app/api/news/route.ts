import { NextResponse } from 'next/server';
import localNews from '@/data/localNews.json';

interface NewsItem {
  id?: string | number;
  testo?: string;
  data?: number;
  [key: string]: string | number | undefined; 
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lang = searchParams.get('lang') || 'it';

  let remoteNews: NewsItem[] = [];
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

  // Merge, filter, and sort
  let combinedNews = [...localNews, ...remoteNews];
  
  // Filter out news older than 30 days (or missing date) to keep it strictly fresh
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  combinedNews = combinedNews.filter(item => {
    const itemDate = item.data || 0;
    return itemDate > thirtyDaysAgo;
  });

  // Sort by date descending (newest first)
  combinedNews.sort((a, b) => (b.data || 0) - (a.data || 0));

  return NextResponse.json(combinedNews);
}
