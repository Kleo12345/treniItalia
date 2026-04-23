'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLocale } from '@/context/LocaleContext';
import styles from './WeatherWidget.module.css';

interface WeatherData {
  source: string;
  temp: number;
  description: string;
  windspeed: number;
  icon: string;
  humidity?: number;
}

export default function WeatherWidget() {
  const { t, lang } = useLocale();
  const [data, setData]       = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchWeather = useCallback(async (manual = false) => {
    if (manual) setSpinning(true);
    setLoading((prev) => (manual ? prev : true));
    setError(false);
    try {
      const res = await fetch(`/api/weather?lang=${lang}`);
      if (!res.ok) throw new Error('failed');
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json);
      setLastUpdated(new Date());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setSpinning(false);
    }
  }, [lang]);

  // Initial fetch + auto-refresh every 10 min
  useEffect(() => {
    fetchWeather();
    const interval = setInterval(() => fetchWeather(), 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchWeather]);

  if (loading) {
    return (
      <div className={styles.skeleton}>
        <div className={`skeleton ${styles.skeletonIcon}`} />
        <div className={styles.skeletonLines}>
          <div className={`skeleton ${styles.skeletonLine}`} style={{ width: '40%' }} />
          <div className={`skeleton ${styles.skeletonLine}`} style={{ width: '60%' }} />
          <div className={`skeleton ${styles.skeletonLine}`} style={{ width: '30%' }} />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={styles.error}>
        <span>⚠️</span>
        <span>{t('weather.error')}</span>
      </div>
    );
  }

  const updatedHM = lastUpdated
    ? lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className={styles.widget}>
      {/* Floating weather icon */}
      <div className={styles.iconWrapper}>{data.icon}</div>

      {/* Main info */}
      <div className={styles.info}>
        <div className={styles.title}>{t('weather.title')}</div>
        <div className={styles.temp}>{data.temp}°C</div>
        <div className={styles.description}>{data.description}</div>
      </div>

      {/* Stats */}
      <div className={styles.stats}>
        <div className={styles.statItem}>
          <span className={styles.statIcon}>💨</span>
          <span>{t('weather.wind')}: {data.windspeed} km/h</span>
        </div>
        {data.humidity != null && (
          <div className={styles.statItem}>
            <span className={styles.statIcon}>💧</span>
            <span>{t('weather.humidity')}: {data.humidity}%</span>
          </div>
        )}
        {updatedHM && (
          <div className={styles.statItem}>
            <span className={styles.statIcon}>🕐</span>
            <span>{updatedHM}</span>
          </div>
        )}
      </div>

      {/* Source badge */}
      <span className={styles.sourceBadge}>{t('weather.source')}: {data.source}</span>

      {/* Manual refresh */}
      <button
        className={styles.refreshBtn}
        onClick={() => fetchWeather(true)}
        title={t('weather.refresh')}
        aria-label={t('weather.refresh')}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={spinning ? styles.spinning : undefined}
        >
          <polyline points="23 4 23 10 17 10" />
          <polyline points="1 20 1 14 7 14" />
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
        </svg>
        {t('weather.refresh')}
      </button>
    </div>
  );
}
