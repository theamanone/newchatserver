'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from 'sonner';

interface AdminData {
  applicationId: string;
  role: 'admin';
  isActive: boolean;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [adminData, setAdminData] = useState<AdminData | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const verifyAdminAccess = async () => {
      try {
        const response = await fetch('/api/v1/admin/verify');
        const data = await response.json();

        if (!response.ok) {
          toast.error(data.error || 'Unauthorized access');
          router.push('/auth/signin');
          return;
        }

        if (data.role !== 'admin') {
          toast.error('Admin access required');
          router.push('/auth/signin');
          return;
        }

        setAdminData(data);
      } catch (error) {
        toast.error('Failed to verify admin access');
        router.push('/auth/signin');
      } finally {
        setIsLoading(false);
      }
    };

    verifyAdminAccess();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <span className="text-xl font-bold">Admin Dashboard</span>
              </div>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
