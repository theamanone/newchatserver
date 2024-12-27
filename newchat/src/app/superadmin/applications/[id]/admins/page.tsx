'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import Link from 'next/link';
import { Admin, Application } from '@/types';

interface AdminFormValues {
  userId: string;
}

interface DeleteFormValues {
  confirmation: string;
}

const formSchema = z.object({
  userId: z.string().min(3, 'User ID must be at least 3 characters'),
});

const deleteFormSchema = z.object({
  confirmation: z.string().refine(val => val === 'DELETE APP', {
    message: "Please type 'DELETE APP' to confirm"
  })
});

export default function AdminManagement() {
  const params = useParams<{ id: string }>();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [application, setApplication] = useState<Application | null>(null);

  const form = useForm<AdminFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userId: '',
    },
  });

  const deleteForm = useForm<DeleteFormValues>({
    resolver: zodResolver(deleteFormSchema),
    defaultValues: {
      confirmation: '',
    },
  });

  const fetchAdmins = async () => {
    try {
      const response = await fetch(`/api/v1/superadmin/admins?applicationId=${params.id}`);
      const data = await response.json();
      if (response.ok) {
        setAdmins(data.admins);
      } else {
        toast.error(data.error, { duration: 5000 });
      }
    } catch (error) {
      toast.error('Failed to fetch admins', { duration: 5000 });
    }
  };

  const fetchApplication = async () => {
    try {
      const response = await fetch(`/api/v1/superadmin/applications`);
      const data = await response.json();
      if (response.ok) {
        const app = data.applications.find((a: Application) => a._id === params.id);
        setApplication(app);
      } else {
        toast.error(data.error, { duration: 5000 });
      }
    } catch (error) {
      toast.error('Failed to fetch application details', { duration: 5000 });
    }
  };

  useEffect(() => {
    fetchApplication();
    fetchAdmins();
  }, [params.id]);

  const onSubmit = async (values: AdminFormValues) => {
    try {
      // Check if admin already exists
      const existingAdmin = admins.find((admin) => admin.userId === values.userId);
      if (existingAdmin) {
        toast.error('Admin already exists for this application', { duration: 5000 });
        return;
      }

      setIsLoading(true);
      const response = await fetch('/api/v1/superadmin/admins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: values.userId,
          applicationId: params.id,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success('Admin added successfully', { duration: 3000 });
        setIsCreateOpen(false);
        form.reset();
        fetchAdmins();
      } else {
        toast.error(data.error, { duration: 5000 });
      }
    } catch (error) {
      toast.error('Failed to add admin', { duration: 5000 });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteApp = async (values: DeleteFormValues) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/v1/superadmin/applications?appId=${params.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (response.ok) {
        toast.success('Application deleted successfully', { duration: 3000 });
        setIsDeleteOpen(false);
        window.location.href = '/superadmin';
      } else {
        toast.error(data.error, { duration: 5000 });
      }
    } catch (error) {
      toast.error('Failed to delete application', { duration: 5000 });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveAdmin = async (adminId: string) => {
    try {
      const response = await fetch(`/api/v1/superadmin/admins?id=${adminId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (response.ok) {
        toast.success('Admin removed successfully', { duration: 3000 });
        fetchAdmins();
      } else {
        toast.error(data.error, { duration: 5000 });
      }
    } catch (error) {
      toast.error('Failed to remove admin', { duration: 5000 });
    }
  };

  return (
    <div className="container mx-auto py-10 bg-white dark:bg-dark-primary-color text-gray-800 dark:text-white">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <Link href="/superadmin">
            <Button variant="ghost" className="mr-4 hover:bg-gray-100 dark:hover:bg-dark-quaternary-hover-color">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">
            Manage Admins - {application?.name}
          </h1>
        </div>
        <Button 
          variant="destructive" 
          onClick={() => setIsDeleteOpen(true)}
          className="bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Application
        </Button>
      </div>

      <div className="flex justify-end mb-6">
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-light-primary-color hover:bg-light-primary-hover-color dark:bg-dark-quaternary-color dark:hover:bg-dark-quaternary-hover-color text-white">
              <Plus className="mr-2 h-4 w-4" />
              Add Admin
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white dark:bg-dark-quaternary-color text-gray-800 dark:text-white">
            <DialogHeader>
              <DialogTitle className="text-gray-800 dark:text-white">Add New Admin</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="userId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-800 dark:text-white">User ID</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter user ID"
                          className="bg-white dark:bg-dark-quaternary-color text-gray-800 dark:text-white border-gray-200 dark:border-gray-700"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-red-500" />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full bg-light-primary-color hover:bg-light-primary-hover-color dark:bg-dark-quaternary-color dark:hover:bg-dark-quaternary-hover-color text-white" 
                  disabled={isLoading}
                >
                  {isLoading ? 'Adding...' : 'Add Admin'}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="bg-white dark:bg-dark-quaternary-color text-gray-800 dark:text-white">
          <DialogHeader>
            <DialogTitle className="text-gray-800 dark:text-white">Delete Application</DialogTitle>
          </DialogHeader>
          <Form {...deleteForm}>
            <form onSubmit={deleteForm.handleSubmit(handleDeleteApp)} className="space-y-4">
              <FormField
                control={deleteForm.control}
                name="confirmation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-800 dark:text-white">
                      Type &apos;DELETE APP&apos; to confirm deletion
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="DELETE APP"
                        className="bg-white dark:bg-dark-quaternary-color text-gray-800 dark:text-white border-gray-200 dark:border-gray-700"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                variant="destructive"
                className="w-full bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white" 
                disabled={isLoading}
              >
                {isLoading ? 'Deleting...' : 'Delete Application'}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <div className="bg-white dark:bg-dark-quaternary-color rounded-lg shadow">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-gray-200 dark:border-gray-700">
              <TableHead className="text-gray-600 dark:text-gray-300">User ID</TableHead>
              <TableHead className="text-gray-600 dark:text-gray-300">Role</TableHead>
              <TableHead className="text-gray-600 dark:text-gray-300">Added On</TableHead>
              <TableHead className="text-gray-600 dark:text-gray-300 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {admins.map((admin) => (
              <TableRow key={admin._id} className="border-b border-gray-200 dark:border-gray-700">
                <TableCell className="text-gray-800 dark:text-white">{admin.userId}</TableCell>
                <TableCell className="text-gray-800 dark:text-white">{admin.role}</TableCell>
                <TableCell className="text-gray-800 dark:text-white">
                  {new Date(admin.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  {admin.role !== 'superadmin' && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveAdmin(admin._id)}
                      className="bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
