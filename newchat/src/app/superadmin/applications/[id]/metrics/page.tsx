'use client';

import { useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import ApplicationGraph from '@/components/ApplicationGraph';
import Link from 'next/link';

export default function ApplicationMetrics() {
  const params = useParams();

  return (
    <div className="container mx-auto py-10">
      <motion.div 
        className="flex items-center mb-8"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Link href="/superadmin/applications">
          <Button 
            variant="ghost" 
            className="mr-4 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-foreground">
          Application Metrics
        </h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <ApplicationGraph applicationId={params.id as string} />
      </motion.div>
    </div>
  );
}
