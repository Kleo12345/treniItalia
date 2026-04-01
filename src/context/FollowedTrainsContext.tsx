'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface FollowedTrain {
  numeroTreno: string;
  origine: string;
  destinazione: string;
  categoriaDescrizione: string;
  lastStationName?: string;
}

interface FollowedTrainsContextType {
  followedTrains: FollowedTrain[];
  followTrain: (train: Omit<FollowedTrain, 'lastStationName'>) => void;
  unfollowTrain: (numeroTreno: string) => void;
  isFollowed: (numeroTreno: string) => boolean;
}

const FollowedTrainsContext = createContext<FollowedTrainsContextType>({
  followedTrains: [],
  followTrain: () => {},
  unfollowTrain: () => {},
  isFollowed: () => false,
});

export const FollowedTrainsProvider = ({ children }: { children: React.ReactNode }) => {
  const [followedTrains, setFollowedTrains] = useState<FollowedTrain[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const stored = localStorage.getItem('followedTrains');
    if (stored) {
      try {
        setFollowedTrains(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse followedTrains from localStorage', e);
      }
    }
  }, []);

  const saveToStorage = (trains: FollowedTrain[]) => {
    localStorage.setItem('followedTrains', JSON.stringify(trains));
  };

  const followTrain = (train: Omit<FollowedTrain, 'lastStationName'>) => {
    setFollowedTrains((prev) => {
      const exists = prev.find((t) => t.numeroTreno === train.numeroTreno);
      if (exists) return prev;
      const newList = [...prev, train];
      saveToStorage(newList);
      return newList;
    });

    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    } else if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Train Followed', {
        body: `You are now following train ${train.numeroTreno}.`
      });
    }
  };

  const unfollowTrain = (numeroTreno: string) => {
    setFollowedTrains((prev) => {
      const newList = prev.filter((t) => t.numeroTreno !== numeroTreno);
      saveToStorage(newList);
      return newList;
    });
  };

  const isFollowed = (numeroTreno: string) => {
    return followedTrains.some((t) => t.numeroTreno === numeroTreno);
  };

  useEffect(() => {
    if (!isClient || followedTrains.length === 0) return;

    const pollInterval = 30_000; // 30 seconds

    const checkTrains = async () => {
      // Create a map to collect updates to avoid multiple state calls
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

          if (currentStop) {
             const stationName = currentStop.stazione;
             if (train.lastStationName !== stationName) {
               // The train reached a new station!
               if ('Notification' in window && Notification.permission === 'granted') {
                 new Notification(`Treno ${train.numeroTreno}`, {
                   body: `Il treno è a ${stationName}`
                 });
               }
               // Update tracked last station
               updatedTrains[i] = { ...train, lastStationName: stationName };
               updates = true;
             }
          }
        } catch (err) {
          console.error(`Error polling train ${train.numeroTreno}:`, err);
        }
      }

      if (updates) {
        setFollowedTrains(updatedTrains);
        saveToStorage(updatedTrains);
      }
    };

    const intervalId = setInterval(checkTrains, pollInterval);

    return () => clearInterval(intervalId);
  }, [isClient, followedTrains]); // Rebind effect if followedTrains changes (so we don't use stale array)

  return (
    <FollowedTrainsContext.Provider value={{ followedTrains, followTrain, unfollowTrain, isFollowed }}>
      {children}
    </FollowedTrainsContext.Provider>
  );
};

export const useFollowedTrains = () => useContext(FollowedTrainsContext);
