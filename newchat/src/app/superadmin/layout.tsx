'use client';

import { useSelectedLayoutSegments, usePathname, useRouter } from 'next/navigation';
import { Suspense, useCallback, useEffect } from 'react';

// Utility to generate application routes
const generateAppRoutes = (appId: string) => [
  `/superadmin/applications/${appId}/settings`,
  `/superadmin/applications/${appId}/admins`,
  `/superadmin/applications/${appId}/analytics`,
  `/superadmin/applications/${appId}/logs`,
];

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const segments = useSelectedLayoutSegments();
  const pathname = usePathname();
  const router = useRouter();

  const prefetchRoutes = useCallback(async (appId: string) => {
    const routes = generateAppRoutes(appId);
    
    // Prefetch all routes in parallel
    await Promise.all(
      routes.map(route => router.prefetch(route))
    );
  }, [router]);

  useEffect(() => {
    // Extract appId from the current path if we're in an application route
    const appIdMatch = pathname.match(/\/superadmin\/applications\/([^\/]+)/);
    
    if (appIdMatch) {
      const appId = appIdMatch[1];
      prefetchRoutes(appId);
    }

    // If we're on the main superadmin page, prefetch the first few applications
    if (pathname === '/superadmin') {
      const prefetchInitialApps = async () => {
        try {
          const response = await fetch('/api/v1/superadmin/applications');
          const data = await response.json();
          if (response.ok && data.applications) {
            // Prefetch routes for the first 5 applications
            await Promise.all(
              data.applications
                .slice(0, 5)
                .map((app: any) => prefetchRoutes(app._id))
            );
          }
        } catch (error) {
          console.error('Failed to prefetch application routes:', error);
        }
      };

      prefetchInitialApps();
    }
  }, [pathname, prefetchRoutes]);

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    }>
      {children}
    </Suspense>
  );
}
