import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Linkedin, Globe, MessageSquare, Share2, MoreHorizontal, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  job: {
    title: string;
    company: string;
    location: string;
    type: string;
  };
}

export const JobChannelSimulator = ({ job }: Props) => {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <Globe className="h-5 w-5 text-primary" />
        <h3 className="font-bold text-lg tracking-tight">Multi-Channel Distribution (Simulated)</h3>
      </div>

      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-t-4 border-t-[#0077b5]">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-[#0077b5] font-bold text-sm">
              <Linkedin className="h-4 w-4" />
              LinkedIn Simulator
            </div>
            <CardTitle className="text-xl mt-2">{job.title}</CardTitle>
            <CardDescription>{job.company} • {job.location}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-blue-50 text-blue-700 rounded-lg text-sm flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              This job is successfully "live" on LinkedIn
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="bg-[#0077b5] hover:bg-[#006097]">Easy Apply</Button>
              <Button size="sm" variant="outline">Save</Button>
            </div>
            <div className="pt-4 border-t flex items-center justify-between text-muted-foreground">
              <div className="flex gap-4">
                <Share2 className="h-4 w-4" />
                <MessageSquare className="h-4 w-4" />
              </div>
              <MoreHorizontal className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-t-4 border-t-primary">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-primary font-bold text-sm">
              <Globe className="h-4 w-4" />
              Company Career Page
            </div>
            <CardTitle className="text-xl mt-2">{job.title}</CardTitle>
            <CardDescription>{job.location} • {job.type}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button size="sm">Apply Now</Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
