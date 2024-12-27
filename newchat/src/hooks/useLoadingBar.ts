'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

interface LoadingBar {
  start: () => void;
  finish: () => void;
}

export function useLoadingBar(): LoadingBar {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const loadingBar = document.createElement('div');
    loadingBar.style.position = 'fixed';
    loadingBar.style.top = '0';
    loadingBar.style.left = '0';
    loadingBar.style.height = '4px';
    loadingBar.style.backgroundColor = '#2563eb';
    loadingBar.style.transition = 'width 0.2s ease-in-out, opacity 0.2s ease-in-out';
    loadingBar.style.zIndex = '9999';
    loadingBar.style.opacity = '0';
    loadingBar.style.width = '0%';
    document.body.appendChild(loadingBar);

    return () => {
      loadingBar.remove();
    };
  }, []);

  // Handle route changes
  useEffect(() => {
    const loadingBar = document.querySelector<HTMLDivElement>('div[style*="position: fixed"][style*="top: 0"]');
    if (!loadingBar) return;

    loadingBar.style.width = '0%';
    loadingBar.style.opacity = '1';
    setTimeout(() => {
      loadingBar.style.width = '90%';
      setTimeout(() => {
        loadingBar.style.width = '100%';
        setTimeout(() => {
          loadingBar.style.opacity = '0';
        }, 200);
      }, 100);
    }, 10);
  }, [pathname, searchParams]);

  const start = () => {
    const loadingBar = document.querySelector<HTMLDivElement>('div[style*="position: fixed"][style*="top: 0"]');
    if (!loadingBar) return;
    loadingBar.style.width = '0%';
    loadingBar.style.opacity = '1';
    setTimeout(() => {
      loadingBar.style.width = '90%';
    }, 10);
  };

  const finish = () => {
    const loadingBar = document.querySelector<HTMLDivElement>('div[style*="position: fixed"][style*="top: 0"]');
    if (!loadingBar) return;
    loadingBar.style.width = '100%';
    setTimeout(() => {
      loadingBar.style.opacity = '0';
    }, 200);
  };

  return { start, finish };
}
