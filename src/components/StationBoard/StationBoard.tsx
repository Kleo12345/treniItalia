'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLocale } from '@/context/LocaleContext';
import styles from './StationBoard.module.css';

interface Train {
  numeroTreno: number;
  categoria?: string;
  categoriaDescrizione?: string;
  destinazione?: string;
  origine?: string;
  compOrarioPartenza?: string;
  compOrarioArrivo?: string;
  ritardo: number;
  binarioEffettivoPartenzaDescrizione?: string;
  binarioEffettivoArrivoDescrizione?: string;
  compNumeroTreno?: string;
  codOrigine?: string;
}

interface StationBoardProps {
  stationId: string;
  stationName: string;
  onSelectTrain: (trainNumber: string) => void;
  delayThreshold: number;
}

export default function StationBoard({
  stationId,
  stationName,
  onSelectTrain,
  delayThreshold,
}: StationBoardProps) {
  const { t } = useLocale();
  const [activeTab, setActiveTab] = useState<'departures' | 'arrivals'>('departures');
  const [trains, setTrains] = useState<Train[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBoard = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = activeTab === 'departures'
        ? `/api/stations/${stationId}/departures`
        : `/api/stations/${stationId}/arrivals`;
      const res = await fetch(endpoint);
      const data = await res.json();
      if (Array.isArray(data)) {
        setTrains(data);
      } else {
        setTrains([]);
      }
    } catch {
      setTrains([]);
    } finally {
      setLoading(false);
    }
  }, [stationId, activeTab]);

  useEffect(() => {
    fetchBoard();
    const interval = setInterval(fetchBoard, 30_000);
    return () => clearInterval(interval);
  }, [fetchBoard]);

  const formatDelay = (delay: number) => {
    if (delay <= 0) return t('station.onTime');
    return t('station.delayMinutes', { min: String(delay) });
  };

  const getDelayClass = (delay: number) => {
    if (delay <= 0) return styles.onTime;
    if (delay >= delayThreshold) return styles.delayAlert;
    return styles.delayed;
  };

  return (
    <div className={styles.board}>
      <h2 className={styles.stationName}>
        {stationName}
      </h2>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'departures' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('departures')}
        >
          {t('station.departures')}
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'arrivals' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('arrivals')}
        >
          {t('station.arrivals')}
        </button>
      </div>

      <div className="glass-panel" style={{ overflow: 'auto' }}>
        {loading ? (
          <div style={{ padding: '1rem' }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={styles.skeletonRow}>
                <div className={`skeleton ${styles.skeletonCell}`} style={{ width: '60px' }} />
                <div className={`skeleton ${styles.skeletonCell}`} style={{ flex: 1 }} />
                <div className={`skeleton ${styles.skeletonCell}`} style={{ width: '50px' }} />
                <div className={`skeleton ${styles.skeletonCell}`} style={{ width: '70px' }} />
              </div>
            ))}
          </div>
        ) : trains.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            {t('station.noTrains')}
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.tableHeader}>{t('station.train')}</th>
                <th className={styles.tableHeader}>
                  {activeTab === 'departures' ? t('station.destination') : t('station.origin')}
                </th>
                <th className={styles.tableHeader}>{t('station.scheduledTime')}</th>
                <th className={styles.tableHeader}>{t('station.delay')}</th>
                <th className={`${styles.tableHeader} ${styles.hideOnMobile}`}>
                  {t('station.platform')}
                </th>
              </tr>
            </thead>
            <tbody>
              {trains.map((train, i) => (
                <tr
                  key={`${train.numeroTreno}-${i}`}
                  className={styles.tableRow}
                  onClick={() => onSelectTrain(String(train.numeroTreno))}
                >
                  <td className={styles.tableCell}>
                    <span className={styles.trainNum}>{train.numeroTreno}</span>
                    {train.categoriaDescrizione && (
                      <span className={styles.trainCategory}>
                        {train.categoriaDescrizione}
                      </span>
                    )}
                  </td>
                  <td className={styles.tableCell}>
                    {activeTab === 'departures'
                      ? train.destinazione || '—'
                      : train.origine || '—'}
                  </td>
                  <td className={`${styles.tableCell} ${styles.time}`}>
                    {activeTab === 'departures'
                      ? train.compOrarioPartenza || '—'
                      : train.compOrarioArrivo || '—'}
                  </td>
                  <td className={styles.tableCell}>
                    <span className={getDelayClass(train.ritardo)}>
                      {formatDelay(train.ritardo)}
                    </span>
                  </td>
                  <td className={`${styles.tableCell} ${styles.platform} ${styles.hideOnMobile}`}>
                    {(activeTab === 'departures'
                      ? train.binarioEffettivoPartenzaDescrizione
                      : train.binarioEffettivoArrivoDescrizione) || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
