
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit, Eye, EyeOff, Users, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';

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
  company_id?: string;
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
  const [companySlug, setCompanySlug] = useState<string | null>(null);

  useEffect(() => {
    if (jobs.length > 0) {
      fetchAppCounts();
      fetchCompanySlug();
    }
  }, [jobs]);

  const fetchCompanySlug = async () => {
    if (jobs[0]?.company_id) {
      const { data } = await supabase.from('companies').select('slug').eq('id', jobs[0].company_id).single();
      if (data) setCompanySlug(data.slug);
    }
  };

  const fetchAppCounts = async () => {
    const jobIds = jobs.map(j => j.id);
    const { data: apps } = await supabase
      .from('applications')
      .select('job_id')
      .in('job_id', jobIds);

    const counts: Record<string, number> = {};
    jobIds.forEach(id => { counts[id] = 0; });
    apps?.forEach(a => { counts[a.job_id] = (counts[a.job_id] || 0) + 1; });
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

    const { data } = await supabase
      .from('applications')
      .select('*')
      .eq('job_id', jobId)
      .order('created_at', { ascending: false });

    setJobApps(data || []);
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
            You haven't posted any jobs yet. Check the "Post Job" tab.
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
                {job.is_published && companySlug && (
                  <Button size="sm" variant="ghost" asChild title="View on Careers Page">
                    <Link to={`/company/${companySlug}/${job.id}`} target="_blank">
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </Button>
                )}
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
            <p className="text-sm line-clamp-2 text-muted-foreground">{job.description}</p>

            <div className="flex items-center justify-between mt-4">
              <p className="text-xs text-muted-foreground">
                Posted: {new Date(job.created_at).toLocaleDateString()}
              </p>
              {(appCounts[job.id] || 0) > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleExpand(job.id)}
                  className="text-xs font-bold text-primary"
                >
                  {expandedJob === job.id ? (
                    <>Hide Applications <ChevronUp className="h-3 w-3 ml-1" /></>
                  ) : (
                    <>View {appCounts[job.id]} Application{appCounts[job.id] !== 1 ? 's' : ''} <ChevronDown className="h-3 w-3 ml-1" /></>
                  )}
                </Button>
              )}
            </div>

            {expandedJob === job.id && (
              <div className="mt-4 border-t pt-4 space-y-3">
                {appsLoading ? (
                  <p className="text-sm text-muted-foreground text-center py-4 animate-pulse">Loading applications...</p>
                ) : jobApps.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No applications found.</p>
                ) : (
                  jobApps.map(app => (
                    <div key={app.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="space-y-0.5">
                        <p className="font-bold text-sm tracking-tight">{app.name}</p>
                        <p className="text-xs text-muted-foreground">{app.email}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        {app.resume_url && (
                          <Button size="sm" variant="outline" className="h-8 text-xs bg-white" asChild>
                            <a href={app.resume_url} target="_blank" rel="noreferrer">Resume</a>
                          </Button>
                        )}
                        <span className="text-[10px] font-medium text-slate-400">
                          {new Date(app.created_at).toLocaleDateString()}
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
