'use client';

import { useState, useEffect } from 'react';
import { useLocale } from '@/context/LocaleContext';
import styles from './NewsBanner.module.css';

interface NewsItem {
  titolo?: string;
  testo?: string;
  title?: string;
  text?: string;
  data?: number;
}

export default function NewsBanner() {
  const { t } = useLocale();
  const [news, setNews] = useState<NewsItem[]>([]);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await fetch('/api/news');
        const data = await res.json();
        if (Array.isArray(data)) {
          setNews(data.slice(0, 5));
        }
      } catch {
        /* silent */
      }
    };
    fetchNews();
    const interval = setInterval(fetchNews, 120_000);
    return () => clearInterval(interval);
  }, []);

  if (news.length === 0) return null;

  return (
    <div className={`glass-panel ${styles.banner}`}>
      <div className={styles.title}>
        {t('news.title')}
      </div>
      <div className={styles.newsList}>
        {news.map((item, i) => (
          <div key={i} className={styles.newsItem}>
            {item.titolo || item.title || item.testo || item.text || '—'}
          </div>
        ))}
      </div>
    </div>
  );
}
