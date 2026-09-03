'use client';

import { useEffect } from 'react';
import { store } from '@/lib/store';

export default function RealtimeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize Supabase Realtime subscriptions for cross-device sync
    store.subscribeToRealtimeChanges();

    return () => {
      store.unsubscribeFromRealtimeChanges();
    };
  }, []);

  return <>{children}</>;
}
