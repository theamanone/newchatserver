'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Settings, Users2, Power, Upload, Trash2, Building2, Loader2 } from 'lucide-react';

interface ApplicationCardProps {
  app: {
    _id: string;
    name: string;
    logo?: {
      url: string;
      publicId: string;
    };
    isActive: boolean;
    adminCount: number;
    createdAt: string;
  };
  onManageAdmins: (appId: string) => void;
  onSettings: (appId: string) => void;
  onToggleActive: (appId: string, currentState: boolean) => void;
  onUploadLogo: (appId: string) => void;
  onRemoveLogo: (appId: string) => void;
}

export function ApplicationCard({
  app,
  onManageAdmins,
  onSettings,
  onToggleActive,
  onUploadLogo,
  onRemoveLogo,
}: ApplicationCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleToggleActive = async () => {
    setIsLoading(true);
    try {
      await onToggleActive(app._id, app.isActive);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="w-full hover:shadow-lg transition-shadow duration-200 border-none">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <div className="flex items-start space-x-4">
            <div className="relative w-16 h-16 flex-shrink-0">
              {app.logo ? (
                <>
                  <Image
                    src={app.logo.url}
                    alt={app.name}
                    fill
                    className="rounded-lg object-cover"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full shadow-lg"
                    onClick={() => onRemoveLogo(app._id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </>
              ) : (
                <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center relative">
                  <Building2 className="h-8 w-8 text-muted-foreground" />
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full shadow-lg"
                    onClick={() => onUploadLogo(app._id)}
                  >
                    <Upload className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
            <div className="space-y-1 min-w-0">
              <CardTitle className="text-xl font-bold truncate pr-4">{app.name}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {app.adminCount} {app.adminCount === 1 ? 'Admin' : 'Admins'}
              </p>
              <p className="text-sm text-muted-foreground">
                Created {new Date(app.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <Badge 
            variant={app.isActive ? "success" : "destructive"}
            className="capitalize whitespace-nowrap"
          >
            {app.isActive ? "Active" : "Inactive"}
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onManageAdmins(app._id)}
              className="w-full"
            >
              <Users2 className="h-4 w-4 mr-2" />
              <span className="truncate">Admins</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSettings(app._id)}
              className="w-full"
            >
              <Settings className="h-4 w-4 mr-2" />
              <span className="truncate">Settings</span>
            </Button>
            <Button
              variant={app.isActive ? "outline" : "default"}
              size="sm"
              onClick={handleToggleActive}
              disabled={isLoading}
              className={`w-full border col-span-2 ${
                app.isActive 
                  ? 'border-green-500 text-green-500 hover:bg-green-50 dark:hover:bg-green-950' 
                  : 'border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-950'
              }`}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Power className="h-4 w-4 mr-2" />
              )}
              <span className="truncate">
                {app.isActive ? "Deactivate" : "Activate"}
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
