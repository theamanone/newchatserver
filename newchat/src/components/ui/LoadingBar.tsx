'use client';

import { useEffect, useCallback } from 'react';
import NProgress from 'nprogress';
import { usePathname, useSearchParams } from 'next/navigation';
import { create } from 'zustand';

interface LoadingStore {
  isLoading: boolean;
  startLoading: () => void;
  stopLoading: () => void;
}

export const useLoadingStore = create<LoadingStore>((set) => ({
  isLoading: false,
  startLoading: () => set({ isLoading: true }),
  stopLoading: () => set({ isLoading: false }),
}));

export function startPageLoading() {
  useLoadingStore.getState().startLoading();
}

export function stopPageLoading() {
  useLoadingStore.getState().stopLoading();
}

export function LoadingBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isLoading = useLoadingStore((state) => state.isLoading);

  useEffect(() => {
    NProgress.configure({ 
      showSpinner: false,
      minimum: 0.3,
      easing: 'ease',
      speed: 800,
    });
  }, []);

  const handleLoadingChange = useCallback(() => {
    if (isLoading) {
      NProgress.start();
    } else {
      NProgress.done();
    }
  }, [isLoading]);

  // Handle route changes
  useEffect(() => {
    NProgress.start();
    const timer = setTimeout(() => {
      NProgress.done();
    }, 300);

    return () => {
      clearTimeout(timer);
      NProgress.done();
    };
  }, [pathname, searchParams]);

  // Handle manual loading states
  useEffect(() => {
    handleLoadingChange();
  }, [handleLoadingChange]);

  return null;
}
