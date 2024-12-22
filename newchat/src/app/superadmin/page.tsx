'use client';

import { Suspense, useCallback, useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import ApplicationCard from '@/app/components/superadmin/ApplicationCard';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';

// Types
interface Application {
  _id: string;
  name: string;
  logo?: {
    url: string;
    publicId: string;
  };
  active: boolean;
  settings?: Record<string, any>;
  adminCount: number;
  createdAt: string;
  updatedAt: string;
}

const formSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  settings: z.object({}).optional(),
});

export default function SuperAdminDashboard() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      settings: {},
    },
  });

  // Prefetch routes for applications
  const prefetchApplicationRoutes = useCallback((appId: string) => {
    startTransition(() => {
      router.prefetch(`/superadmin/applications/${appId}/admins`);
      router.prefetch(`/superadmin/applications/${appId}/settings`);
    });
  }, [router]);

  const fetchApplications = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/superadmin/applications');
      const data = await response.json();
      
      if (response.ok) {
        setApplications(data.applications);
        // Prefetch routes for all applications
        data.applications.forEach((app: Application) => {
          prefetchApplicationRoutes(app._id);
        });
      } else {
        toast.error(data.error || 'Failed to fetch applications');
      }
    } catch (error) {
      toast.error('Failed to fetch applications');
      console.error('Fetch applications error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [prefetchApplicationRoutes]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
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
        setIsOpen(false);
        form.reset();
        fetchApplications();
      } else {
        toast.error(data.error || 'Failed to create application');
      }
    } catch (error) {
      toast.error('Failed to create application');
      console.error('Create application error:', error);
    } finally {
      setIsSubmitting(false);
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
        toast.success('Application status updated successfully');
        fetchApplications();
      } else {
        toast.error(data.error || 'Failed to update application status');
      }
    } catch (error) {
      toast.error('Failed to update application status');
      console.error('Update application error:', error);
    }
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

  const handleNavigation = useCallback((appId: string, route: string) => {
    startTransition(() => {
      router.push(`/superadmin/applications/${appId}/${route}`);
    });
  }, [router]);

  const handleManageAdmins = useCallback((appId: string) => {
    handleNavigation(appId, 'admins');
  }, [handleNavigation]);

  const handleSettings = useCallback((appId: string) => {
    handleNavigation(appId, 'settings');
  }, [handleNavigation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Applications</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Application
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Application</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 w-full">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter application name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating...' : 'Create Application'}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Suspense 
        fallback={
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div 
                key={i} 
                className="h-48 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"
              />
            ))}
          </div>
        }
      >
        <div className="grid gap-6">
          {applications.map((app:any) => (
            <ApplicationCard
              key={app._id}
              app={app}
              onManageAdmins={() => handleManageAdmins(app._id)}
              onSettings={() => handleSettings(app._id)}
              onUploadLogo={() => handleUploadLogo(app._id)}
              onToggleActive={() => handleToggleActive(app._id, app.isActive)}
              onRemoveLogo={() => handleRemoveLogo(app._id)}
            />
          ))}
        </div>
      </Suspense>
    </div>
  );
}
