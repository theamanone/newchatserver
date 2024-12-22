'use client';

import { useEffect, useState, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, Settings, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface AppStats {
  totalUsers: number;
  activeChats: number;
  pendingMessages: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AppStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Prefetch all possible routes
  useEffect(() => {
    const prefetchRoutes = () => {
      startTransition(() => {
        router.prefetch('/admin/users');
        router.prefetch('/admin/messages');
        router.prefetch('/admin/settings');
      });
    };

    prefetchRoutes();
  }, [router]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/v1/admin/stats', {
          headers: {
            'admin-id': 'windsurf99999999999', // Using static admin ID as requested
          }
        });
        const data = await response.json();

        if (response.ok) {
          setStats(data);
        } else {
          toast.error(data.error);
        }
      } catch (error) {
        toast.error('Failed to fetch statistics');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const navigateToMessages = () => {
    startTransition(() => {
      router.push('/admin/messages');
    });
  };

  const navigateToUsers = () => {
    startTransition(() => {
      router.push('/admin/users');
    });
  };

  const navigateToSettings = () => {
    startTransition(() => {
      router.push('/admin/settings');
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={navigateToMessages}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pendingMessages || 0}</div>
            <p className="text-xs text-muted-foreground">Pending messages</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={navigateToUsers}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">Total users</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={navigateToSettings}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Chats</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeChats || 0}</div>
            <p className="text-xs text-muted-foreground">Open conversations</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Button 
          onClick={navigateToMessages} 
          className="h-24"
          disabled={isPending}
        >
          <MessageCircle className="mr-2 h-4 w-4" />
          Manage Messages
        </Button>
        <Button 
          onClick={navigateToUsers} 
          className="h-24"
          disabled={isPending}
        >
          <Users className="mr-2 h-4 w-4" />
          Manage Users
        </Button>
        <Button 
          onClick={navigateToSettings} 
          variant="outline" 
          className="h-24"
          disabled={isPending}
        >
          <Settings className="mr-2 h-4 w-4" />
          App Settings
        </Button>
      </div>
    </div>
  );
}
