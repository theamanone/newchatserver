'use client';

import React, { useState, useCallback, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Sun, Moon, MessageCircle, Building2, Loader2, BarChart3 } from 'lucide-react';
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ApplicationCard } from '@/app/components/superadmin/ApplicationCard';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppContext } from '@/context/useContext';
import { Badge } from '@/components/ui/badge';
import { AnimatePresence, motion } from 'framer-motion';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
});

interface Application {
  _id: string;
  name: string;
  isActive: boolean;
  adminCount: number;
  createdAt: string;
  logo?: {
    url: string;
    publicId: string;
  };
}

export default function SuperAdminDashboard() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const router = useRouter();
  const { isDarkMode, toggleDarkMode, handleLogout } = useAppContext();

  const [showLimitWarning, setShowLimitWarning] = useState(false);
  const [totalApps, setTotalApps] = useState(0);


  const APP_LIMIT = 10;

  const fetchApplications = async () => {
    try {
      const response = await fetch('/api/v1/superadmin/applications');
      const data = await response.json();
      if (response.ok) {
        setApplications(data.applications);
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      toast.error('Failed to fetch applications');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (appId: string, currentState: boolean) => {
    try {
      const response = await fetch('/api/v1/superadmin/applications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appId,
          isActive: !currentState,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setApplications(prev =>
          prev.map(app =>
            app._id === appId ? { ...app, isActive: !currentState } : app
          )
        );
        toast.success(
          `Application ${!currentState ? 'activated' : 'deactivated'} successfully`
        );
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      toast.error('Failed to toggle application status');
    }
  };

  const handleDarkModeToggle = () => {
    toggleDarkMode(isDarkMode ? "light" : "dark");
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value.toLowerCase());
  };

  const filteredApplications = applications.filter(app => {
    const searchLower = searchQuery.toLowerCase();
    if (!searchLower) return true;

    // Search by name
    if (app.name.toLowerCase().includes(searchLower)) return true;

    // Search by status (active/inactive)
    if ('active'.includes(searchLower) && app.isActive) return true;
    if ('inactive'.includes(searchLower) && !app.isActive) return true;

    // Search by date (simple format: YYYY-MM-DD)
    const createdDate = new Date(app.createdAt).toISOString().split('T')[0];
    if (createdDate.includes(searchLower)) return true;

    return false;
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const response = await fetch('/api/v1/superadmin/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success('Application created successfully');
        setIsCreateOpen(false);
        form.reset();
        fetchApplications();
      } else {
        toast.error(data.error || 'Failed to create application');
      }
    } catch (error) {
      toast.error('Failed to create application');
      console.error('Create application error:', error);
    }
  };

  const handleUploadLogo = async (appId: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('logo', file);
      formData.append('appId', appId);

      try {
        const response = await fetch('/api/v1/superadmin/applications/logo', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();
        if (response.ok) {
          toast.success('Logo uploaded successfully');
          fetchApplications();
        } else {
          toast.error(data.error || 'Failed to upload logo');
        }
      } catch (error) {
        toast.error('Failed to upload logo');
        console.error('Upload logo error:', error);
      }
    };
    input.click();
  };

  const handleRemoveLogo = async (appId: string) => {
    try {
      const response = await fetch(`/api/v1/superadmin/applications/logo?appId=${appId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (response.ok) {
        toast.success('Logo removed successfully');
        fetchApplications();
      } else {
        toast.error(data.error || 'Failed to remove logo');
      }
    } catch (error) {
      toast.error('Failed to remove logo');
      console.error('Remove logo error:', error);
    }
  };

  const handleNavigation = useCallback((appId: string, route: string) => {
    router.push(`/superadmin/applications/${appId}/${route}`);
  }, [router]);

  const handleManageAdmins = useCallback((appId: string) => {
    handleNavigation(appId, 'admins');
  }, [handleNavigation]);

  const handleSettings = useCallback((appId: string) => {
    handleNavigation(appId, 'settings');
  }, [handleNavigation]);

  useEffect(() => {
    fetchApplications();
  }, []);

  const ApplicationSkeleton = () => (
    <div className="w-full hover:shadow-lg transition-shadow duration-200">
      <div className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-lg bg-gray-200 animate-pulse" />
          <div className="space-y-2">
            <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
        <div className="h-6 w-20 bg-gray-200 rounded animate-pulse" />
      </div>
      <div>
        <div className="space-y-4">
          <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
          <div className="grid grid-cols-2 gap-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-9 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      

      <div className="container mx-auto px-4 py-6 space-y-6 max-w-7xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">Applications</h1>
            <p className="text-muted-foreground">
              Manage your organization's applications and their settings
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDarkModeToggle}
              className="rounded-full"
            >
              {isDarkMode ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/superadmin/messages')}
              className="rounded-full"
            >
              <MessageCircle className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-black dark:text-white" />
            <Input
              placeholder="Search by name, status (active/inactive), or date (YYYY-MM-DD)..."
              value={searchQuery}
              onChange={handleSearch}
              className="pl-9 w-full bg-background"
              disabled={isLoading}
            />
          </div>
          <Button
            onClick={() => setIsCreateOpen(true)}
            disabled={isLoading}
            className="whitespace-nowrap"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Application
          </Button>
        </div>

        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {[...Array(6)].map((_, i) => (
                <ApplicationSkeleton key={i} />
              ))}
            </motion.div>
          ) : filteredApplications.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center justify-center py-12 text-center"
            >
              <div className="rounded-full bg-muted p-3 mb-4">
                <Search className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">No applications found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery
                  ? `No applications match "${searchQuery}"`
                  : "Get started by creating your first application"}
              </p>
              {!searchQuery && (
                <Button onClick={() => setIsCreateOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Application
                </Button>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              <AnimatePresence mode="popLayout">
                {filteredApplications.map((app, index) => (
                  <motion.div
                    key={app._id}
                    layout
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                      y: 0,
                      transition: {
                        type: "spring",
                        stiffness: 100,
                        damping: 20,
                        delay: index * 0.1
                      }
                    }}
                    exit={{
                      opacity: 0,
                      scale: 0.8,
                      y: -20,
                      transition: {
                        type: "spring",
                        stiffness: 100,
                        damping: 20
                      }
                    }}
                    whileHover={{
                      scale: 1.02,
                      transition: {
                        type: "spring",
                        stiffness: 300,
                        damping: 30
                      }
                    }}
                    className="bg-white dark:bg-dark-quaternary-color p-6 rounded-lg shadow-lg border border-border/50 backdrop-blur-xl"
                  >
                    <ApplicationCard
                      app={app}
                      onManageAdmins={() => router.push(`/superadmin/applications/${app._id}/admins`)}
                      onSettings={() => router.push(`/superadmin/applications/${app._id}/settings`)}
                      onToggleActive={() => handleToggleActive(app._id, app.isActive)}
                      onUploadLogo={() => handleUploadLogo(app._id)}
                      onRemoveLogo={() => handleRemoveLogo(app._id)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="sm:max-w-[425px] bg-light-primary-color/80 backdrop-blur-xl border border-border text-balance dark:text-white dark:bg-dark-primary-color/20">
            <DialogHeader>
            <DialogTitle>Application Limit Warning</DialogTitle>
            <DialogDescription>
              You currently have {applications.length} applications. Creating more than {APP_LIMIT} applications may impact the performance of your socket server.
              <br /><br />
              For optimal performance, consider:
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Upgrading your socket server capacity</li>
                <li>Optimizing existing application connections</li>
                <li>Monitoring server resource usage</li>
              </ul>
              </DialogDescription>
            </DialogHeader>
            <Form {...form} >
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-black dark:text-white">Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter application name"
                          className="bg-background/50 dark:bg-background/10 backdrop-blur-sm text-black border-border/50"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-destructive text-red-500" />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full bg-primary border text-black dark:text-white hover:bg-primary/90"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Application'
                  )}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
