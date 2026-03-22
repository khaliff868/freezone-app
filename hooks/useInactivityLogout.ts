'use client';

import { useEffect, useRef } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { toast } from 'sonner';

const WARNING_TIME = 25 * 60 * 1000; // 25 minutes
const LOGOUT_TIME = 30 * 60 * 1000; // 30 minutes
const TOAST_ID = 'session-inactivity-warning';

export default function useInactivityLogout() {
  const { status } = useSession();

  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const logoutTimerRef = useRef<NodeJS.Timeout | null>(null);
  const warningShownRef = useRef(false);

  const clearTimers = () => {
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }

    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
  };

  const startTimers = () => {
    clearTimers();
    warningShownRef.current = false;

    warningTimerRef.current = setTimeout(() => {
      if (warningShownRef.current) return;

      warningShownRef.current = true;

      toast.warning('You will be logged out in 5 minutes due to inactivity.', {
        id: TOAST_ID,
        duration: 10000,
      });
    }, WARNING_TIME);

    logoutTimerRef.current = setTimeout(() => {
      toast.dismiss(TOAST_ID);
      signOut({ callbackUrl: '/login' });
    }, LOGOUT_TIME);
  };

  const resetTimers = () => {
    toast.dismiss(TOAST_ID);
    startTimers();
  };

  useEffect(() => {
    if (status !== 'authenticated') {
      clearTimers();
      toast.dismiss(TOAST_ID);
      return;
    }

    const events: Array<keyof WindowEventMap> = [
      'mousemove',
      'keydown',
      'mousedown',
      'scroll',
      'touchstart',
    ];

    const handleActivity = () => {
      resetTimers();
    };

    events.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    startTimers();

    return () => {
      clearTimers();
      toast.dismiss(TOAST_ID);

      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [status]);
}
