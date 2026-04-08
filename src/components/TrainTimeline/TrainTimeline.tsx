'use client';

import { useState, useEffect } from 'react';
import { useLocale } from '@/context/LocaleContext';
import { useFollowedTrains } from '@/context/FollowedTrainsContext';
import DelayChart from '@/components/DelayChart/DelayChart';
import styles from './TrainTimeline.module.css';

interface FermataStop {
  stazione: string;
  id?: string;
  programmata?: number | null;
  effettiva?: number | null;
  ritardo?: number;
  ritardoPartenza?: number;
  ritardoArrivo?: number;
  arrivoReale?: number | null;
  partenzaReale?: number | null;
  partenza_teorica?: number | null;
  arrivo_teorico?: number | null;
  actualFermataType?: number;
  progressivo?: number;
}

interface TrainData {
  numeroTreno: number;
  categoria?: string;
  categoriaDescrizione?: string;
  origine?: string;
  destinazione?: string;
  compOrarioPartenza?: string;
  compOrarioArrivo?: string;
  fermate?: FermataStop[];
  stazioneUltimoRilevamento?: string;
  ritardo?: number;
  compRitardo?: string[];
  tipoTreno?: string;
  subTitle?: string;
}

interface TrainTimelineProps {
  trainNumber: string;
  onBack: () => void;
  delayThreshold: number;
}

function formatMs(ms: number | null | undefined): string {
  if (!ms) return '—';
  const d = new Date(ms);
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

export default function TrainTimeline({ trainNumber, onBack, delayThreshold }: TrainTimelineProps) {
  const { t } = useLocale();
  const { isFollowed, followTrain, unfollowTrain } = useFollowedTrains();
  const [data, setData] = useState<TrainData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrain = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/trains/${trainNumber}/route`);
        if (!res.ok) throw new Error('Train not found');
        const json = await res.json();
        if (json.error) throw new Error(json.error);
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : t('app.error'));
      } finally {
        setLoading(false);
      }
    };
    fetchTrain();
    const interval = setInterval(fetchTrain, 30_000);
    return () => clearInterval(interval);
  }, [trainNumber, t]);

  // Determine which stop is the "current" one
  const getCurrentStopIndex = (fermate: FermataStop[]): number => {
    for (let i = fermate.length - 1; i >= 0; i--) {
      const f = fermate[i];
      if (f.arrivoReale || f.partenzaReale || f.effettiva) {
        // If this is the last stop with actual data, and the next has none, this is "current"
        if (i < fermate.length - 1) return i;
        return i; // arrived at final
      }
    }
    return -1; // hasn't departed yet
  };

  return (
    <div className={styles.container}>
      <button className={styles.backBtn} onClick={onBack}>
        ← {t('search.placeholder').split(' ')[0]}
      </button>

      {loading ? (
        <div className={`glass-panel ${styles.skeletonTimeline}`}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={styles.skeletonStop}>
              <div className="skeleton" style={{ width: 10, height: 10, borderRadius: '50%' }} />
              <div className="skeleton" style={{ flex: 1, height: 16 }} />
              <div className="skeleton" style={{ width: 50, height: 16 }} />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          {error}
        </div>
      ) : data ? (
        <>
          <div className={styles.header}>
            <div className={styles.headerTop}>
              <h2 className={styles.trainTitle}>
                {t('train.trainNumber', { number: String(data.numeroTreno) })}
                {data.categoriaDescrizione && (
                  <span className={styles.badge}>{data.categoriaDescrizione}</span>
                )}
                {data.ritardo !== undefined && data.ritardo > 0 && (
                  <span className={styles.badge} style={{
                    background: data.ritardo >= delayThreshold ? 'var(--status-cancelled)' : 'var(--status-delayed)'
                  }}>
                    +{data.ritardo} min
                  </span>
                )}
              </h2>
              <button 
                onClick={() => {
                  if (isFollowed(String(data.numeroTreno))) {
                    unfollowTrain(String(data.numeroTreno));
                  } else {
                    followTrain({
                      numeroTreno: String(data.numeroTreno),
                      origine: data.origine || 'Unknown',
                      destinazione: data.destinazione || 'Unknown',
                      categoriaDescrizione: data.categoriaDescrizione || 'Treno'
                    });
                  }
                }}
                className={styles.followBtn}
              >
                {isFollowed(String(data.numeroTreno)) ? '★ ' + t('train.unfollow', { defaultValue: 'Unfollow' }) : '☆ ' + t('train.follow', { defaultValue: 'Follow' })}
              </button>
            </div>
            <p className={styles.routeLabel}>
              {data.origine || '?'} → {data.destinazione || '?'}
            </p>
          </div>

          {data.fermate && data.fermate.length > 1 && (
            <div className="glass-panel" style={{ padding: '1rem 1.25rem 0.75rem' }}>
              <DelayChart
                stops={data.fermate.map(f => ({
                  name: f.stazione,
                  delay: f.ritardoArrivo ?? f.ritardoPartenza ?? f.ritardo ?? 0
                }))}
                threshold={delayThreshold}
              />
            </div>
          )}

          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            {data.fermate && data.fermate.length > 0 ? (
              <div className={styles.timeline}>
                {data.fermate.map((stop, i) => {
                  const currentIdx = getCurrentStopIndex(data.fermate!);
                  const isPast = i < currentIdx;
                  const isCurrent = i === currentIdx;
                  const isFuture = i > currentIdx && currentIdx !== -1;

                  const stopClass = isPast
                    ? styles.stopPast
                    : isCurrent
                      ? styles.stopCurrent
                      : isFuture
                        ? styles.stopFuture
                        : '';

                  const dotClass = isPast
                    ? styles.dotPast
                    : isCurrent
                      ? styles.dotCurrent
                      : styles.dotFuture;

                  const delay = stop.ritardoArrivo ?? stop.ritardoPartenza ?? stop.ritardo ?? 0;

                  const scheduledArr = stop.arrivo_teorico ?? stop.programmata;
                  const scheduledDep = stop.partenza_teorica ?? stop.programmata;
                  const actualArr = stop.arrivoReale ?? stop.effettiva;
                  const actualDep = stop.partenzaReale;

                  return (
                    <div key={i} className={`${styles.stop} ${stopClass}`}>
                      <span className={`${styles.dot} ${dotClass}`} />
                      {isCurrent && <span className={styles.dotCurrentPing} />}
                      <div className={styles.stopInfo}>
                        <div className={styles.stopName}>{stop.stazione}</div>
                        <div className={styles.stopTimes}>
                          {i === 0 ? (
                            <>
                              <span>{t('train.departed')}: {formatMs(scheduledDep)}</span>
                              {actualDep && <span>→ {formatMs(actualDep)}</span>}
                            </>
                          ) : i === (data.fermate!.length - 1) ? (
                            <>
                              <span>{t('train.arrived')}: {formatMs(scheduledArr)}</span>
                              {actualArr && <span>→ {formatMs(actualArr)}</span>}
                            </>
                          ) : (
                            <>
                              <span>{formatMs(scheduledArr)}</span>
                              {actualArr && <span>→ {formatMs(actualArr)}</span>}
                            </>
                          )}
                          {delay !== 0 && (
                            <span className={`${styles.stopDelay} ${delay > 0 ? styles.delayPositive : styles.delayNegative}`}>
                              {delay > 0 ? `+${delay}'` : `${delay}'`}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>
                {t('app.noResults')}
              </p>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
