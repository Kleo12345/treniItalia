'use client';

import { ThemeProvider } from '@/context/ThemeContext';
import { LocaleProvider } from '@/context/LocaleContext';
import { FollowedTrainsProvider } from '@/context/FollowedTrainsContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <LocaleProvider>
        <FollowedTrainsProvider>{children}</FollowedTrainsProvider>
      </LocaleProvider>
    </ThemeProvider>
  );
}
