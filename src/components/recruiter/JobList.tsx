import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit, Eye, EyeOff, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Job {
  id: string;
  title: string;
  company: string;
  description: string;
  location: string;
  salary: string;
  type: string;
  category: string;
  employee_range: string;
  created_at: string;
  is_published: boolean | null;
  visibility: string | null;
}

interface JobListProps {
  jobs: Job[];
  loading: boolean;
  onEdit: (job: Job) => void;
  onDelete: (jobId: string) => void;
  onTogglePublish: (jobId: string, currentStatus: boolean | null) => void;
}

export const JobList = ({ jobs, loading, onEdit, onDelete, onTogglePublish }: JobListProps) => {
  const [appCounts, setAppCounts] = useState<Record<string, number>>({});
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [jobApps, setJobApps] = useState<any[]>([]);
  const [appsLoading, setAppsLoading] = useState(false);

  useEffect(() => {
    if (jobs.length > 0) fetchAppCounts();
  }, [jobs]);

  const fetchAppCounts = async () => {
    const jobIds = jobs.map(j => j.id);

    // Fetch counts from both tables
    const { data: pubApps } = await supabase
      .from('public_applications')
      .select('job_id')
      .in('job_id', jobIds);

    const { data: authApps } = await supabase
      .from('job_applications')
      .select('job_id')
      .in('job_id', jobIds);

    const counts: Record<string, number> = {};
    jobIds.forEach(id => { counts[id] = 0; });
    pubApps?.forEach(a => { counts[a.job_id] = (counts[a.job_id] || 0) + 1; });
    authApps?.forEach(a => { counts[a.job_id] = (counts[a.job_id] || 0) + 1; });
    setAppCounts(counts);
  };

  const toggleExpand = async (jobId: string) => {
    if (expandedJob === jobId) {
      setExpandedJob(null);
      setJobApps([]);
      return;
    }
    setExpandedJob(jobId);
    setAppsLoading(true);

    const { data: pubApps } = await supabase
      .from('public_applications')
      .select('id, full_name, email, resume_url, source, status, created_at')
      .eq('job_id', jobId)
      .order('created_at', { ascending: false });

    const { data: authApps } = await supabase
      .from('job_applications')
      .select('id, applicant_name, applicant_email, status, applied_at, source')
      .eq('job_id', jobId)
      .order('applied_at', { ascending: false });

    const combined = [
      ...(pubApps || []).map(a => ({
        id: a.id, name: a.full_name, email: a.email, resumeUrl: a.resume_url,
        source: a.source || 'direct', status: a.status, date: a.created_at, type: 'public' as const,
      })),
      ...(authApps || []).map(a => ({
        id: a.id, name: a.applicant_name, email: a.applicant_email, resumeUrl: null,
        source: (a as any).source || 'direct', status: a.status, date: a.applied_at, type: 'auth' as const,
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    setJobApps(combined);
    setAppsLoading(false);
  };

  if (loading) {
    return <p className="text-center py-8 text-muted-foreground">Loading jobs...</p>;
  }

  if (jobs.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center py-8 text-muted-foreground">
            You haven't posted any jobs yet. Click on the "Post Job" tab to create your first job posting.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {jobs.map((job) => (
        <Card
          key={job.id}
          className={`border-l-4 ${job.is_published ? 'border-l-green-500' : 'border-l-muted'}`}
        >
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {job.is_published ? (
                    <Badge className="bg-primary/10 text-primary">
                      <Eye className="h-3 w-3 mr-1" /> Published
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <EyeOff className="h-3 w-3 mr-1" /> Draft
                    </Badge>
                  )}
                  {(appCounts[job.id] || 0) > 0 && (
                    <Badge variant="outline" className="gap-1">
                      <Users className="h-3 w-3" />
                      {appCounts[job.id]} applicant{appCounts[job.id] !== 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
                <CardTitle>{job.title}</CardTitle>
                <CardDescription>
                  {job.company} • {job.location} • {job.type}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={job.is_published || false}
                  onCheckedChange={() => onTogglePublish(job.id, job.is_published)}
                />
                <Button size="sm" variant="outline" onClick={() => onEdit(job)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="destructive" onClick={() => onDelete(job.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-2">
              {job.salary && `Salary: ${job.salary} • `}
              Category: {job.category}
              {job.employee_range && ` • Company Size: ${job.employee_range}`}
            </p>
            <p className="text-sm line-clamp-3">{job.description}</p>

            <div className="flex items-center justify-between mt-4">
              <p className="text-xs text-muted-foreground">
                Posted: {new Date(job.created_at).toLocaleDateString()}
              </p>
              {(appCounts[job.id] || 0) > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleExpand(job.id)}
                  className="text-xs"
                >
                  {expandedJob === job.id ? (
                    <>Hide Applications <ChevronUp className="h-3 w-3 ml-1" /></>
                  ) : (
                    <>View Applications <ChevronDown className="h-3 w-3 ml-1" /></>
                  )}
                </Button>
              )}
            </div>

            {/* Inline applications list */}
            {expandedJob === job.id && (
              <div className="mt-4 border-t pt-4 space-y-3">
                {appsLoading ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Loading applications…</p>
                ) : jobApps.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No applications found.</p>
                ) : (
                  jobApps.map(app => (
                    <div key={app.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border">
                      <div className="space-y-0.5">
                        <p className="font-medium text-sm">{app.name}</p>
                        <p className="text-xs text-muted-foreground">{app.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-[10px]">
                            {app.source === 'external_careers' ? '🌐 Careers Page' : '📋 Direct'}
                          </Badge>
                          <Badge className={
                            app.status === 'applied' ? 'bg-blue-500/10 text-blue-600' :
                            app.status === 'shortlisted' ? 'bg-green-500/10 text-green-600' :
                            'bg-gray-500/10 text-gray-600'
                          }>
                            {app.status || 'applied'}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {app.resumeUrl && (
                          <Button size="sm" variant="outline" asChild>
                            <a href={app.resumeUrl} target="_blank" rel="noreferrer">Resume</a>
                          </Button>
                        )}
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(app.date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
