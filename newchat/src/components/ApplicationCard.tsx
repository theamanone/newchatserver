'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Users, BarChart3, MessageCircle, Upload, Trash2, Building2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ApplicationGraph from './ApplicationGraph';
import Image from 'next/image';

interface Application {
  _id: string;
  name: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
  logo?: string;
  messageCount?: number;
  isActive?: boolean;
}

interface ApplicationCardProps {
  app: Application;
  onManageAdmins: () => void;
  onSettings: () => void;
  onToggleActive: () => void;
  onUploadLogo: () => void;
  onRemoveLogo: () => void;
}

export default function ApplicationCard({ 
  app, 
  onManageAdmins, 
  onSettings,
  onToggleActive,
  onUploadLogo,
  onRemoveLogo 
}: ApplicationCardProps) {
  const [isGraphOpen, setIsGraphOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col h-full space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="relative group">
              {app.logo ? (
                <div className="relative w-12 h-12 rounded-lg overflow-hidden">
                  <Image
                    src={app.logo}
                    alt={app.name}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-white hover:text-white hover:bg-white/20"
                      onClick={onUploadLogo}
                    >
                      <Upload className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-white hover:text-white hover:bg-white/20"
                      onClick={onRemoveLogo}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors cursor-pointer" onClick={onUploadLogo}>
                  <Upload className="h-6 w-6 text-primary" />
                </div>
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">{app.name}</h3>
              <p className="text-sm text-muted-foreground">
                Created: {new Date(app.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <Badge
            variant={app.status === 'active' ? 'success' : 'destructive'}
            className="capitalize"
          >
            {app.status}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="text-muted-foreground hover:text-primary w-full justify-start"
            onClick={onManageAdmins}
          >
            <Users className="h-4 w-4 mr-2" />
            Manage Admins
          </Button>
          <Button
            variant="outline"
            className="text-muted-foreground hover:text-primary w-full justify-start"
            onClick={onSettings}
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button
            variant="outline"
            className="text-muted-foreground hover:text-primary w-full justify-start"
            onClick={() => setIsGraphOpen(true)}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </Button>
          <Button
            variant="outline"
            className="text-muted-foreground hover:text-primary w-full justify-start"
            onClick={onToggleActive}
          >
            <Building2 className="h-4 w-4 mr-2" />
            {app.isActive ? 'Deactivate' : 'Activate'}
          </Button>
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            <span>{app.messageCount?.toLocaleString() || '0'} messages</span>
          </div>
          <span>Last updated: {new Date(app.updatedAt).toLocaleDateString()}</span>
        </div>
      </div>

      <Dialog open={isGraphOpen} onOpenChange={setIsGraphOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {app.name} - Analytics
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <ApplicationGraph applicationId={app._id} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
