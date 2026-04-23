'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import en from '@/locales/en.json';
import it from '@/locales/it.json';
import es from '@/locales/es.json';
import fr from '@/locales/fr.json';
import de from '@/locales/de.json';
import ro from '@/locales/ro.json';
import sq from '@/locales/sq.json';
import zh from '@/locales/zh.json';
import uk from '@/locales/uk.json';
import ar from '@/locales/ar.json';

type NestedStrings = { [key: string]: string | NestedStrings };

const localeFiles: Record<string, NestedStrings> = { 
  en, it, es, fr, de, ro, sq, zh, uk, ar 
};

interface LocaleContextValue {
  lang: string;
  setLang: (lang: string) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

function getNestedValue(obj: NestedStrings, path: string): string {
  if (!obj) return path;
  const keys = path.split('.');
  let current: NestedStrings | string = obj;
  for (const key of keys) {
    if (typeof current === 'string') return path;
    if (!current) return path;
    current = current[key];
    if (current === undefined || current === null) return path;
  }
  return typeof current === 'string' ? current : path;
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState('en');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('locale');
    if (stored && localeFiles[stored]) {
      setTimeout(() => setLangState(stored), 0);
    }
    setTimeout(() => setMounted(true), 0);
  }, []);

  const setLang = useCallback((newLang: string) => {
    setLangState(newLang);
    localStorage.setItem('locale', newLang);
    document.documentElement.lang = newLang; // set HTML lang
  }, []);

  const t = useCallback((key: string, vars?: Record<string, string | number>): string => {
    const dict = localeFiles[lang] || localeFiles['en'];
    let str = getNestedValue(dict, key);
    if (str === key && lang !== 'en') {
        // Fallback to english if key missing in translation
        str = getNestedValue(localeFiles['en'], key);
    }
    if (vars && typeof str === 'string') {
      Object.entries(vars).forEach(([varKey, val]) => {
        str = str.replace(`{${varKey}}`, String(val));
      });
    }
    return str;
  }, [lang]);

  return (
    <LocaleContext.Provider value={{ lang, setLang, t }}>
      {!mounted ? <div style={{ visibility: 'hidden' }}>{children}</div> : children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used within a LocaleProvider');
  return ctx;
}
