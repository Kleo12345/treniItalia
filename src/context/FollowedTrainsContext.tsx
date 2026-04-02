'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface FollowedTrain {
  numeroTreno: string;
  origine: string;
  destinazione: string;
  categoriaDescrizione: string;
  lastStationName?: string;
}

export interface TelegramSettings {
  enabled: boolean;
  token: string;
  chatId: string;
}

interface FollowedTrainsContextType {
  followedTrains: FollowedTrain[];
  followTrain: (train: Omit<FollowedTrain, 'lastStationName'>) => void;
  unfollowTrain: (numeroTreno: string) => void;
  isFollowed: (numeroTreno: string) => boolean;
  telegramSettings: TelegramSettings;
  saveTelegramSettings: (s: TelegramSettings) => void;
  sendTelegramMessage: (message: string) => Promise<{ ok: boolean; error?: string }>;
}

const defaultTelegram: TelegramSettings = { enabled: false, token: '', chatId: '' };

const FollowedTrainsContext = createContext<FollowedTrainsContextType>({
  followedTrains: [],
  followTrain: () => {},
  unfollowTrain: () => {},
  isFollowed: () => false,
  telegramSettings: defaultTelegram,
  saveTelegramSettings: () => {},
  sendTelegramMessage: async () => ({ ok: false }),
});

export const FollowedTrainsProvider = ({ children }: { children: React.ReactNode }) => {
  const [followedTrains, setFollowedTrains] = useState<FollowedTrain[]>([]);
  const [telegramSettings, setTelegramSettings] = useState<TelegramSettings>(defaultTelegram);
  const [isClient, setIsClient] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load from localStorage once on client
  useEffect(() => {
    setIsClient(true);
    try {
      const storedTrains = localStorage.getItem('followedTrains');
      if (storedTrains) {
        const parsed = JSON.parse(storedTrains);
        // Cleanup corrupted 'NUMBER' state from previous failed tests
        const cleaned = Array.isArray(parsed) ? parsed.filter((t: any) => t.numeroTreno !== 'NUMBER') : [];
        setFollowedTrains(cleaned);
      }

      const storedTelegram = localStorage.getItem('telegramSettings');
      if (storedTelegram) setTelegramSettings(JSON.parse(storedTelegram));
    } catch (e) {
      console.error('Failed to load from localStorage', e);
    }
    setIsHydrated(true);
  }, []);

  // Persist to localStorage whenever state changes (ONLY after hydration)
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem('followedTrains', JSON.stringify(followedTrains));
    }
  }, [followedTrains, isHydrated]);

  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem('telegramSettings', JSON.stringify(telegramSettings));
    }
  }, [telegramSettings, isHydrated]);

  const saveTelegramSettings = (s: TelegramSettings) => {
    setTelegramSettings(s);
  };

  // Proxy through our own server-side route for security
  const sendTelegramMessage = useCallback(async (message: string): Promise<{ ok: boolean; error?: string }> => {
    const { token, chatId } = telegramSettings;
    if (!token || !chatId) return { ok: false, error: 'No credentials configured.' };
    try {
      const res = await fetch('/api/notify/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, chatId, message }),
      });
      const data = await res.json();
      if (!res.ok) return { ok: false, error: data.error ?? 'Unknown error' };
      return { ok: true };
    } catch {
      return { ok: false, error: 'Network error.' };
    }
  }, [telegramSettings]);

  const followTrain = (train: Omit<FollowedTrain, 'lastStationName'>) => {
    setFollowedTrains((prev) => {
      if (prev.find((t) => t.numeroTreno === train.numeroTreno)) {
        return prev;
      }
      return [...prev, train];
    });

    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    } else if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Train Followed', { body: `You are now following train ${train.numeroTreno}.` });
    }
  };

  const unfollowTrain = (numeroTreno: string) => {
    setFollowedTrains((prev) => prev.filter((t) => t.numeroTreno !== numeroTreno));
  };

  const isFollowed = (numeroTreno: string) =>
    followedTrains.some((t) => t.numeroTreno === numeroTreno);

  // Background polling
  useEffect(() => {
    if (!isClient || followedTrains.length === 0) return;

    const checkTrains = async () => {
      let updates = false;
      const updatedTrains = [...followedTrains];

      for (let i = 0; i < updatedTrains.length; i++) {
        const train = updatedTrains[i];
        try {
          const res = await fetch(`/api/trains/${train.numeroTreno}/route`);
          if (!res.ok) continue;
          const data = await res.json();
          if (data.error || !data.fermate) continue;

          let currentStop = null;
          for (let j = data.fermate.length - 1; j >= 0; j--) {
            const f = data.fermate[j];
            if (f.arrivoReale || f.partenzaReale || f.effettiva) {
              currentStop = f;
              break;
            }
          }

          if (currentStop && train.lastStationName !== currentStop.stazione) {
            const stationName: string = currentStop.stazione;
            const notifyMsg = `🚆 Treno ${train.numeroTreno}\nArrivato a: <b>${stationName}</b>`;

            // Browser notification
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(`Treno ${train.numeroTreno}`, { body: `Il treno è a ${stationName}` });
            }

            // Telegram notification (if enabled)
            if (telegramSettings.enabled && telegramSettings.token && telegramSettings.chatId) {
              fetch('/api/notify/telegram', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: telegramSettings.token, chatId: telegramSettings.chatId, message: notifyMsg }),
              }).catch(() => { /* silent */ });
            }

            updatedTrains[i] = { ...train, lastStationName: stationName };
            updates = true;
          }
        } catch (err) {
          console.error(`Error polling train ${train.numeroTreno}:`, err);
        }
      }

      if (updates) {
        setFollowedTrains(updatedTrains);
      }
    };

    const intervalId = setInterval(checkTrains, 30_000);
    return () => clearInterval(intervalId);
  }, [isClient, followedTrains, telegramSettings]);

  return (
    <FollowedTrainsContext.Provider value={{
      followedTrains, followTrain, unfollowTrain, isFollowed,
      telegramSettings, saveTelegramSettings, sendTelegramMessage,
    }}>
      {children}
    </FollowedTrainsContext.Provider>
  );
};

export const useFollowedTrains = () => useContext(FollowedTrainsContext);
