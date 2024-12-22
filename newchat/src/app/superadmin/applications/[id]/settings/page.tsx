'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import Link from 'next/link';

const formSchema = z.object({
  welcomeMessage: z.string().optional(),
  supportEmail: z.string().email().optional(),
  maxMessageLength: z.string().transform(Number).optional(),
  customThemeColor: z.string().optional(),
});

export default function ApplicationSettings() {
  const params = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [application, setApplication] = useState<any>(null);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      welcomeMessage: '',
      supportEmail: '',
      maxMessageLength: '',
      customThemeColor: '',
    },
  });

  const fetchApplication = async () => {
    try {
      const response = await fetch(`/api/v1/superadmin/applications`);
      const data = await response.json();
      if (response.ok) {
        const app = data.applications.find((a: any) => a._id === params.id);
        setApplication(app);
        
        // Set form values from application settings
        form.reset({
          welcomeMessage: app.settings.welcomeMessage || '',
          supportEmail: app.settings.supportEmail || '',
          maxMessageLength: app.settings.maxMessageLength?.toString() || '',
          customThemeColor: app.settings.customThemeColor || '',
        });
      } else {
        toast.error(data.error, {
          duration: 5000,
          dismissible: true,
        });
      }
    } catch (error) {
      toast.error('Failed to fetch application details', {
        duration: 5000,
        dismissible: true,
      });
    }
  };

  useEffect(() => {
    fetchApplication();
  }, [params.id]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/v1/superadmin/applications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appId: params.id,
          settings: {
            ...application.settings,
            ...values,
          },
        }),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success('Settings updated successfully', {
          duration: 3000,
          dismissible: true,
        });
        fetchApplication();
      } else {
        toast.error(data.error || 'Failed to update settings', {
          duration: 5000,
          dismissible: true,
        });
      }
    } catch (error) {
      toast.error('Failed to update settings', {
        duration: 5000,
        dismissible: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10 bg-white dark:bg-dark-primary-color text-black dark:text-white">
      <div className="flex items-center mb-8">
        <Link href="/superadmin">
          <Button variant="ghost" className="mr-4 hover:bg-light-quaternary-color dark:hover:bg-dark-quaternary-hover-color">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">
          Application Settings - {application?.name}
        </h1>
      </div>

      <Card className="bg-white dark:bg-dark-quaternary-color border-light-default-borlder-color dark:border-dark-default-borlder-color">
        <CardHeader>
          <CardTitle className="text-black dark:text-white">General Settings</CardTitle>
          <CardDescription className="text-light-font-light-color dark:text-dark-font-light-color">
            Configure the general settings for your application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-6">
              <FormField
                control={form.control}
                name="welcomeMessage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-black dark:text-white">Welcome Message</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter welcome message for users"
                        className="bg-white dark:bg-dark-quaternary-color text-black dark:text-white border-light-default-borlder-color dark:border-dark-default-borlder-color"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="supportEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-black dark:text-white">Support Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Enter support email"
                        className="bg-white dark:bg-dark-quaternary-color text-black dark:text-white border-light-default-borlder-color dark:border-dark-default-borlder-color"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maxMessageLength"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-black dark:text-white">Maximum Message Length</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter maximum message length"
                        className="bg-white dark:bg-dark-quaternary-color text-black dark:text-white border-light-default-borlder-color dark:border-dark-default-borlder-color"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="customThemeColor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-black dark:text-white">Custom Theme Color</FormLabel>
                    <FormControl>
                      <div className="flex space-x-2">
                        <Input
                          type="text"
                          placeholder="Enter hex color code"
                          className="bg-white dark:bg-dark-quaternary-color text-black dark:text-white border-light-default-borlder-color dark:border-dark-default-borlder-color"
                          {...field}
                        />
                        <Input
                          type="color"
                          className="w-12 p-1 h-10 bg-white dark:bg-dark-quaternary-color border-light-default-borlder-color dark:border-dark-default-borlder-color"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                disabled={isLoading}
                className="bg-light-primary-color hover:bg-light-primary-hover-color dark:bg-dark-quaternary-color dark:hover:bg-dark-quaternary-hover-color text-white"
              >
                <Save className="mr-2 h-4 w-4" />
                {isLoading ? 'Saving...' : 'Save Settings'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
