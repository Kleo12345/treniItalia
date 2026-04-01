'use client';

import { useEffect, useState } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useLocale } from '@/context/LocaleContext';
import styles from './Header.module.css';

export default function Header() {
  const { theme, toggleTheme } = useTheme();
  const { t } = useLocale();
  const [trainCount, setTrainCount] = useState<number | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/stats');
        const data = await res.json();
        if (data && typeof data === 'object' && !data.error) {
          const count =
            data.trpiù ?? data.trainCount ?? data.totale ?? null;
          if (typeof count === 'number') {
            setTrainCount(count);
          }
        }
      } catch {
        /* silent */
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 60_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className={styles.header}>
      <a href="/" className={styles.brand} style={{ textDecoration: 'none', color: 'inherit' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 11h16M12 3v8M8 19l-2 3M16 19l2 3M2 14h20M4 3h16rectx2y2"/>
          <rect x="4" y="3" width="16" height="16" rx="2" ry="2" />
        </svg>
        <span className={styles.logo}>{t('app.title')}</span>
      </a>

      <div className={styles.controls}>
        {trainCount !== null && (
          <div className={styles.statsChip}>
            <span className={styles.statsDot} />
            {trainCount.toLocaleString()} {t('stats.trainsRunning')}
          </div>
        )}
        <button
          className={styles.iconBtn}
          onClick={toggleTheme}
          aria-label={t('settings.theme')}
          title={theme === 'dark' ? t('settings.light') : t('settings.dark')}
        >
          {theme === 'dark' ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
          )}
        </button>
      </div>
    </header>
  );
}
