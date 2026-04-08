'use client';

import { ThemeProvider } from '@/context/ThemeContext';
import { LocaleProvider } from '@/context/LocaleContext';
import { FollowedTrainsProvider } from '@/context/FollowedTrainsContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import OfflineBanner from '@/components/OfflineBanner';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <LocaleProvider>
          <FollowedTrainsProvider>
            <OfflineBanner />
            {children}
          </FollowedTrainsProvider>
        </LocaleProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
