import React from 'react';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Settings, Users, Power, Upload, Trash2 } from 'lucide-react';

interface ApplicationCardProps {
  app: {
    _id: string;
    name: string;
    isActive: boolean | any;
    adminCount: number;
    settings: Record<string, any>;
    logo?: {
      url: string;
      publicId: string;
    };
  };
  onManageAdmins: (appId: string) => void;
  onSettings: (appId: string) => void;
  onToggleActive: (appId: string, currentState: boolean | any) => void;
  onUploadLogo: (appId: string) => void;
  onRemoveLogo: (appId: string) => void;
}

export default function ApplicationCard({
  app,
  onManageAdmins,
  onSettings,
  onToggleActive,
  onUploadLogo,
  onRemoveLogo,
}: ApplicationCardProps) {
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-4">
          {app.logo ? (
            <div className="relative w-12 h-12">
              <Image
                src={app.logo.url}
                alt={`${app.name} logo`}
                fill
                className="rounded-lg object-cover"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 h-6 w-6"
                onClick={() => onRemoveLogo(app._id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="icon"
              className="w-12 h-12"
              onClick={() => onUploadLogo(app._id)}
            >
              <Upload className="h-6 w-6" />
            </Button>
          )}
          <CardTitle className="text-xl font-bold">{app.name}</CardTitle>
        </div>
        <Badge variant={app.isActive ? "success" : "destructive"}>
          {app.isActive ? "Active" : "Inactive"}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>{app.adminCount} {app.adminCount === 1 ? 'Admin' : 'Admins'}</span>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onManageAdmins(app._id)}
            >
              <Users className="h-4 w-4 mr-2" />
              Manage Admins
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSettings(app._id)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button
              variant={app.isActive ? "destructive" : "default"}
              size="sm"
              onClick={() => onToggleActive(app._id, app.isActive)}
            >
              <Power className="h-4 w-4 mr-2" />
              {app.isActive ? "Deactivate" : "Activate"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
