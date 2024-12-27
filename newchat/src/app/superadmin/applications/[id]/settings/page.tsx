'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from 'sonner';
import { ArrowLeft, Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Settings {
  supportEmail?: string;
  welcomeMessage: string;
  maxMessageLength: number;
}

const DEFAULT_SETTINGS = {
  supportEmail: '',
  welcomeMessage: 'Welcome! How can we assist you today? Our support team is here to help with any questions or concerns you may have.',
  maxMessageLength: 2000,
};

export default function ApplicationSettings() {
  const params = useParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isDirty, setIsDirty] = useState(false);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/v1/superadmin/applications/${params.id}/settings`);
        if (response.ok) {
          const data = await response.json();
          setSettings({
            ...DEFAULT_SETTINGS,
            ...data.settings
          });
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
        toast.error('Failed to fetch settings');
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchSettings();
    }
  }, [params.id]);

  const handleChange = (field: keyof Settings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
    setIsDirty(true);
  };

  const setDefaultMessage = () => {
    handleChange('welcomeMessage', DEFAULT_SETTINGS.welcomeMessage);
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/v1/superadmin/applications/${params.id}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        toast.success('Settings saved successfully');
        setIsDirty(false);
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-light-primary-color dark:border-dark-primary-color"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl bg-white dark:bg-dark-quaternary-color">
      <div className="flex items-center justify-between mb-6">
        <Button 
          variant="ghost" 
          onClick={() => router.back()} 
          className="gap-2 text-light-font-light-color dark:text-dark-font-light-color hover:bg-light-quaternary-hover-color dark:hover:bg-dark-quaternary-hover-color"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <h1 className="text-2xl font-bold text-light-font-light-color dark:text-dark-font-light-color">Application Settings</h1>
        <Button
          onClick={handleSave}
          disabled={!isDirty}
          className={cn(
            "bg-light-primary-color hover:bg-light-primary-hover-color dark:bg-dark-quaternary-dark-base dark:hover:bg-dark-quaternary-dark-accent text-white transition-opacity",
            !isDirty && "opacity-50 cursor-not-allowed"
          )}
        >
          Save Changes
        </Button>
      </div>

      <Card className="bg-white dark:bg-dark-quaternary-color border-light-default-borlder-color dark:border-dark-default-borlder-color">
        <CardHeader>
          <CardTitle className="text-light-font-light-color dark:text-dark-font-light-color">Chat Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="supportEmail" className="text-light-font-light-color dark:text-dark-font-light-color">Support Email (Optional)</Label>
            <Input
              id="supportEmail"
              type="email"
              value={settings.supportEmail || ''}
              onChange={(e) => handleChange('supportEmail', e.target.value)}
              className="bg-white dark:bg-dark-quaternary-color text-light-font-light-color dark:text-dark-font-light-color border-light-default-borlder-color dark:border-dark-default-borlder-color"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="welcomeMessage" className="text-light-font-light-color dark:text-dark-font-light-color">Welcome Message</Label>
              <Button 
                variant="outline" 
                size="sm"
                onClick={setDefaultMessage}
                className="gap-2 border-light-default-borlder-color dark:border-dark-default-borlder-color text-light-font-light-color dark:text-dark-font-light-color hover:bg-light-quaternary-hover-color dark:hover:bg-dark-quaternary-hover-color"
              >
                <Wand2 className="h-4 w-4" />
                Set Default
              </Button>
            </div>
            <Textarea
              id="welcomeMessage"
              value={settings.welcomeMessage}
              onChange={(e) => handleChange('welcomeMessage', e.target.value)}
              className="bg-white dark:bg-dark-quaternary-color text-light-font-light-color dark:text-dark-font-light-color border-light-default-borlder-color dark:border-dark-default-borlder-color min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxMessageLength" className="text-light-font-light-color dark:text-dark-font-light-color">Maximum Message Length</Label>
            <Input
              id="maxMessageLength"
              type="number"
              min="100"
              max="5000"
              value={settings.maxMessageLength}
              onChange={(e) => handleChange('maxMessageLength', parseInt(e.target.value))}
              className="bg-white dark:bg-dark-quaternary-color text-light-font-light-color dark:text-dark-font-light-color border-light-default-borlder-color dark:border-dark-default-borlder-color"
            />
            <p className="text-sm text-light-font-light-color dark:text-dark-font-light-color opacity-70">
              Maximum number of characters allowed in a message (100-5000)
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
