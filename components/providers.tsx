// Session & Theme Provider Component

'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from './theme-provider';
import useInactivityLogout from '@/hooks/useInactivityLogout';

// ✅ Wrap hook INSIDE SessionProvider
function InactivityGuard({ children }: { children: React.ReactNode }) {
  useInactivityLogout();
  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <InactivityGuard>
        <ThemeProvider>{children}</ThemeProvider>
      </InactivityGuard>
    </SessionProvider>
  );
}
