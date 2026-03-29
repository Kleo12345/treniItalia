'use client';

import { useState, useEffect } from 'react';
import { useLocale } from '@/context/LocaleContext';
import Header from '@/components/Header/Header';
import SearchBox from '@/components/SearchBox/SearchBox';
import StationBoard from '@/components/StationBoard/StationBoard';
import TrainTimeline from '@/components/TrainTimeline/TrainTimeline';
import NewsBanner from '@/components/NewsBanner/NewsBanner';
import styles from './page.module.css';

interface Station {
  name: string;
  id: string;
}

type View = 'home' | 'station' | 'train';

export default function Home() {
  const { t, lang, setLang } = useLocale();

  const [view, setView] = useState<View>('home');
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [selectedTrain, setSelectedTrain] = useState<string>('');
  const [delayThreshold, setDelayThreshold] = useState(15);

  // Load delay threshold from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('delayThreshold');
      if (stored) setDelayThreshold(Number(stored));
    } catch { /* noop */ }
  }, []);

  const handleThresholdChange = (val: string) => {
    const num = parseInt(val, 10);
    if (!isNaN(num) && num > 0) {
      setDelayThreshold(num);
      localStorage.setItem('delayThreshold', String(num));
    }
  };

  const handleSelectStation = (station: Station) => {
    setSelectedStation(station);
    setView('station');
  };

  const handleSelectTrain = (trainNumber: string) => {
    setSelectedTrain(trainNumber);
    setView('train');
  };

  const handleBack = () => {
    if (view === 'train' && selectedStation) {
      setView('station');
    } else {
      setView('home');
      setSelectedStation(null);
      setSelectedTrain('');
    }
  };

  return (
    <div className={styles.main}>
      <Header />

      <div className={styles.content}>
        {view === 'home' && (
          <>
            <div className={styles.hero}>
              <h1>{t('app.title')}</h1>
              <p className={styles.heroSubtitle}>{t('app.subtitle')}</p>
              <div className={styles.searchWrapper}>
                <SearchBox
                  onSelectStation={handleSelectStation}
                  onSelectTrain={handleSelectTrain}
                />
              </div>
              <div className={styles.settingsRow}>
                <label className={styles.settingsLabel}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                  {t('settings.delayThreshold')}
                  <input
                    type="number"
                    className={styles.thresholdInput}
                    value={delayThreshold}
                    onChange={e => handleThresholdChange(e.target.value)}
                    min={1}
                    max={120}
                  />
                </label>
                <label className={styles.settingsLabel} style={{ marginLeft: '1rem' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
                  {t('settings.language')}
                  <select
                    className={styles.thresholdInput}
                    style={{ width: 'auto' }}
                    value={lang}
                    onChange={(e) => setLang(e.target.value)}
                  >
                    <option value="it">Italiano</option>
                    <option value="en">English</option>
                    <option value="ro">Română</option>
                    <option value="ar">العربية</option>
                    <option value="sq">Shqip</option>
                    <option value="zh">中文</option>
                    <option value="uk">Українська</option>
                    <option value="fr">Français</option>
                    <option value="es">Español</option>
                    <option value="de">Deutsch</option>
                  </select>
                </label>
              </div>
            </div>
            <NewsBanner />
          </>
        )}

        {view === 'station' && selectedStation && (
          <>
            <button className={styles.settingsLabel} onClick={handleBack} style={{ cursor: 'pointer', marginBottom: '1rem' }}>
              ← {t('app.title')}
            </button>
            <div className={styles.searchWrapper}>
              <SearchBox
                onSelectStation={handleSelectStation}
                onSelectTrain={handleSelectTrain}
              />
            </div>
            <StationBoard
              stationId={selectedStation.id}
              stationName={selectedStation.name}
              onSelectTrain={handleSelectTrain}
              delayThreshold={delayThreshold}
            />
          </>
        )}

        {view === 'train' && selectedTrain && (
          <TrainTimeline
            trainNumber={selectedTrain}
            onBack={handleBack}
            delayThreshold={delayThreshold}
          />
        )}
      </div>

      <footer className={styles.footer}>
        {t('app.title')} · Data from{' '}
        <a
          href="http://www.viaggiatreno.it"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.footerLink}
        >
          ViaggiaTreno
        </a>
      </footer>
    </div>
  );
}
