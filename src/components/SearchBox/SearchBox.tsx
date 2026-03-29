'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocale } from '@/context/LocaleContext';
import styles from './SearchBox.module.css';

interface Station {
  name: string;
  id: string;
}

interface SearchBoxProps {
  onSelectStation: (station: Station) => void;
  onSelectTrain: (trainNumber: string) => void;
}

export default function SearchBox({ onSelectStation, onSelectTrain }: SearchBoxProps) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Station[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [recentStations, setRecentStations] = useState<Station[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Load recent stations from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('recentStations');
      if (stored) setRecentStations(JSON.parse(stored));
    } catch { /* noop */ }
  }, []);

  // Keyboard shortcut: Ctrl+K to open
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Auto-focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults([]);
      setActiveIndex(0);
    }
  }, [open]);

  const searchStations = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      return;
    }

    // If query is purely numeric, it's a train number – don't search stations
    if (/^\d+$/.test(q.trim())) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/stations/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setResults(data);
        setActiveIndex(0);
      }
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInputChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchStations(value), 250);
  };

  const selectStation = (station: Station) => {
    // Save to recent
    const updated = [station, ...recentStations.filter(s => s.id !== station.id)].slice(0, 8);
    setRecentStations(updated);
    localStorage.setItem('recentStations', JSON.stringify(updated));
    setOpen(false);
    onSelectStation(station);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const isTrainNumber = /^\d+$/.test(query.trim());

    if (e.key === 'Enter') {
      e.preventDefault();
      if (isTrainNumber && query.trim().length > 0) {
        setOpen(false);
        onSelectTrain(query.trim());
      } else if (results.length > 0) {
        selectStation(results[activeIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, 0));
    }
  };

  const isTrainQuery = /^\d+$/.test(query.trim()) && query.trim().length > 0;
  const showRecent = query.length === 0 && recentStations.length > 0;

  return (
    <>
      <button className={styles.trigger} onClick={() => setOpen(true)}>
        <span className={styles.triggerIcon}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        </span>
        {t('search.placeholder')}
        <span className={styles.triggerKbd}>⌘K</span>
      </button>

      {open && (
        <div className={styles.overlay} onClick={() => setOpen(false)}>
          <div className={styles.palette} onClick={e => e.stopPropagation()}>
            <div className={styles.inputRow}>
              <span className={styles.inputIcon}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              </span>
              <input
                ref={inputRef}
                className={styles.input}
                placeholder={t('search.placeholder')}
                value={query}
                onChange={e => handleInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              {loading && <div className={styles.spinner} />}
            </div>

            <div className={styles.results}>
              {isTrainQuery && (
                <div
                  className={styles.resultItem}
                  onClick={() => { setOpen(false); onSelectTrain(query.trim()); }}
                >
                  <span className={styles.resultIcon}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="3" width="16" height="16" rx="2" ry="2"></rect><path d="M4 11h16"></path><path d="M12 3v8"></path><path d="M8 19l-2 3"></path><path d="M16 19l2 3"></path><path d="M2 14h20"></path></svg>
                  </span>
                  <span className={styles.resultName}>
                    {t('train.trainNumber', { number: query.trim() })}
                  </span>
                  <span className={styles.resultCode}>↵ Enter</span>
                </div>
              )}

              {results.map((station, i) => (
                <div
                  key={station.id}
                  className={`${styles.resultItem} ${i === activeIndex ? styles.resultItemActive : ''}`}
                  onClick={() => selectStation(station)}
                >
                  <span className={styles.resultIcon}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                  </span>
                  <span className={styles.resultName}>{station.name}</span>
                  <span className={styles.resultCode}>{station.id}</span>
                </div>
              ))}

              {showRecent && (
                <>
                  {recentStations.map(station => (
                    <div
                      key={station.id}
                      className={styles.resultItem}
                      onClick={() => selectStation(station)}
                    >
                      <span className={styles.resultIcon}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                      </span>
                      <span className={styles.resultName}>{station.name}</span>
                      <span className={styles.resultCode}>{station.id}</span>
                    </div>
                  ))}
                </>
              )}

              {!isTrainQuery && results.length === 0 && !showRecent && query.length >= 2 && !loading && (
                <div className={styles.noResults}>{t('app.noResults')}</div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
