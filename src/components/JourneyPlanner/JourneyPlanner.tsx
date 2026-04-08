'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useLocale } from '@/context/LocaleContext';
import styles from './JourneyPlanner.module.css';

interface Station {
  name: string;
  id: string;
}

interface Leg {
  numeroTreno: string;
  categoria: string;
  origine: string;
  destinazione: string;
  partenza: string;
  arrivo: string;
}

interface Solution {
  durata: string;
  cambi: number;
  legs: Leg[];
}

interface SearchResult {
  type: 'solutions' | 'direct';
  from: string;
  to: string;
  solutions?: Solution[];
  trains?: Leg[];
}

interface JourneyPlannerProps {
  onSelectTrain: (trainNumber: string) => void;
}

function useStationAutocomplete() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Station[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const search = useCallback((q: string) => {
    setQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.length < 2) { setResults([]); return; }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/stations/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        if (Array.isArray(data)) { setResults(data); setActiveIdx(0); }
      } catch { setResults([]); }
      finally { setLoading(false); }
    }, 250);
  }, []);

  const select = (station: Station) => {
    setQuery(station.name);
    setResults([]);
  };

  const clear = () => { setQuery(''); setResults([]); };

  return { query, results, loading, activeIdx, setActiveIdx, search, select, clear };
}

export default function JourneyPlanner({ onSelectTrain }: JourneyPlannerProps) {
  const { t } = useLocale();
  const from = useStationAutocomplete();
  const to = useStationAutocomplete();
  const [datetime, setDatetime] = useState('');
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState<'from' | 'to' | null>(null);

  // Default datetime to now
  useEffect(() => {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    setDatetime(`${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`);
  }, []);

  const handleSearch = async () => {
    if (!from.query.trim() || !to.query.trim()) return;
    setSearching(true);
    setError('');
    setSearchResult(null);
    try {
      const res = await fetch(`/api/search?from=${encodeURIComponent(from.query.trim())}&to=${encodeURIComponent(to.query.trim())}`);
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Search failed'); }
      const data = await res.json();
      setSearchResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setSearching(false);
    }
  };

  const formatTime = (ts: string | number | undefined) => {
    if (!ts) return '—';
    const d = new Date(typeof ts === 'string' ? ts : Number(ts));
    if (isNaN(d.getTime())) return String(ts);
    return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };

  const renderSuggestions = (ac: ReturnType<typeof useStationAutocomplete>, field: 'from' | 'to') => {
    if (focusedField !== field || ac.results.length === 0) return null;
    return (
      <div className={styles.suggestions}>
        {ac.results.map((s, i) => (
          <div
            key={s.id}
            className={`${styles.suggestionItem} ${i === ac.activeIdx ? styles.suggestionActive : ''}`}
            onMouseDown={(e) => { e.preventDefault(); ac.select(s); }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}
          >
            <span style={{ color: 'var(--text-secondary)', display: 'flex' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>
            </span>
            <span style={{ fontWeight: 500 }}>{s.name}</span>
          </div>
        ))}
      </div>
    );
  };

  const handleKeyDown = (ac: ReturnType<typeof useStationAutocomplete>) => (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); ac.setActiveIdx(i => Math.min(i + 1, ac.results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); ac.setActiveIdx(i => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter' && ac.results.length > 0) { e.preventDefault(); ac.select(ac.results[ac.activeIdx]); }
  };

  const swapStations = () => {
    const fq = from.query;
    const tq = to.query;
    from.search(tq);
    to.search(fq);
    // Directly set queries since search triggers debounce
    from.clear();
    to.clear();
    setTimeout(() => {
      from.search(tq);
      to.search(fq);
    }, 0);
  };

  return (
    <div className={styles.planner}>
      <h3 className={styles.plannerTitle}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        {t('planner.title', { defaultValue: 'Journey Planner' })}
      </h3>

      <div className={styles.form}>
        <div className={styles.rowInputs}>
          <div className={`${styles.inputGroup} ${styles.suggestionsWrap}`}>
            <label className={styles.inputLabel}>{t('planner.from', { defaultValue: 'From' })}</label>
            <input
              className={styles.inputField}
              value={from.query}
              onChange={e => from.search(e.target.value)}
              onFocus={() => setFocusedField('from')}
              onBlur={() => setTimeout(() => setFocusedField(null), 150)}
              onKeyDown={handleKeyDown(from)}
              placeholder="Roma Termini"
            />
            {renderSuggestions(from, 'from')}
          </div>

          <div className={`${styles.inputGroup} ${styles.suggestionsWrap}`}>
            <label className={styles.inputLabel}>{t('planner.to', { defaultValue: 'To' })}</label>
            <input
              className={styles.inputField}
              value={to.query}
              onChange={e => to.search(e.target.value)}
              onFocus={() => setFocusedField('to')}
              onBlur={() => setTimeout(() => setFocusedField(null), 150)}
              onKeyDown={handleKeyDown(to)}
              placeholder="Milano Centrale"
            />
            {renderSuggestions(to, 'to')}
          </div>
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.inputLabel}>{t('planner.datetime', { defaultValue: 'Date & Time' })}</label>
          <input
            type="datetime-local"
            className={styles.inputField}
            value={datetime}
            onChange={e => setDatetime(e.target.value)}
          />
        </div>

        <button
          className={styles.searchBtn}
          onClick={handleSearch}
          disabled={searching || !from.query.trim() || !to.query.trim()}
        >
          {searching ? (
            <div className="skeleton" style={{ width: 16, height: 16, borderRadius: '50%' }} />
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          )}
          {t('planner.search', { defaultValue: 'Search' })}
        </button>
      </div>

      {error && (
        <div className={styles.emptyState}>⚠️ {error}</div>
      )}

      {searchResult && (
        <div className={styles.resultsList}>
          {searchResult.type === 'solutions' && searchResult.solutions?.map((sol, i) => (
            <div key={i} className={styles.solutionCard}>
              <div className={styles.solutionHeader}>
                <span className={styles.solutionBadge}>
                  {t('planner.option', { defaultValue: 'Option' })} {i + 1}
                </span>
                <div className={styles.solutionMeta}>
                  <span>⏱ {sol.durata}</span>
                  <span>🔄 {sol.cambi} {t('planner.changes', { defaultValue: 'changes' })}</span>
                </div>
              </div>
              {sol.legs.map((leg, j) => (
                <div key={j} className={styles.legRow}>
                  <span
                    className={styles.legTrainNum}
                    onClick={() => onSelectTrain(String(leg.numeroTreno))}
                  >
                    {leg.numeroTreno}
                  </span>
                  <span className={styles.legCategory}>{leg.categoria}</span>
                  <span>{leg.origine} → {leg.destinazione}</span>
                  <span className={styles.legTimes}>
                    {formatTime(leg.partenza)} – {formatTime(leg.arrivo)}
                  </span>
                </div>
              ))}
            </div>
          ))}

          {searchResult.type === 'direct' && searchResult.trains && searchResult.trains.length > 0 && (
            searchResult.trains.map((train, i) => (
              <div key={i} className={styles.solutionCard}>
                <div className={styles.legRow}>
                  <span
                    className={styles.legTrainNum}
                    onClick={() => onSelectTrain(String(train.numeroTreno))}
                  >
                    {train.numeroTreno}
                  </span>
                  <span className={styles.legCategory}>{train.categoria}</span>
                  <span>→ {train.destinazione}</span>
                  <span className={styles.legTimes}>{formatTime(train.partenza)}</span>
                </div>
              </div>
            ))
          )}

          {searchResult.type === 'direct' && searchResult.trains?.length === 0 && (
            <div className={styles.emptyState}>
              {t('planner.noResults', { defaultValue: 'No direct trains found for this route.' })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
