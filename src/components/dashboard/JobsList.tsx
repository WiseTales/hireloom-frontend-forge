import { supabase } from '@/integrations/supabase/client';
import { Briefcase as BriefcaseIcon, MapPin, Clock } from 'lucide-react';

interface Job {
  id: string;
  title: string;
  location: string;
  salary: string | null;
  type: string;
  category: string;
  department: string | null;
  description: string;
  is_published: boolean;
  visibility: string;
  status: string;
  experience_level: string | null;
  created_at: string;
}

interface JobsListProps {
  jobs: Job[];
  onRefresh: () => void;
}

const statusColors: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  published: 'bg-primary/10 text-primary',
  paused: 'bg-warning/10 text-warning',
  closed: 'bg-destructive/10 text-destructive',
};

export default function JobsList({ jobs, onRefresh }: JobsListProps) {
  const handleStatusChange = async (jobId: string, newStatus: string) => {
    const isPublished = newStatus === 'published';
    await (supabase.from('jobs') as any).update({ status: newStatus, is_published: isPublished }).eq('id', jobId);
    onRefresh();
  };

  const handleDelete = async (jobId: string) => {
    if (!confirm('Delete this job posting?')) return;
    await supabase.from('jobs').delete().eq('id', jobId);
    onRefresh();
  };

  return (
    <div className="bg-card rounded-xl shadow-sm border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-heading font-semibold text-foreground">Your Job Postings</h2>
        <span className="text-sm text-muted-foreground">{jobs.length} total</span>
      </div>

      {jobs.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <BriefcaseIcon className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No job postings yet</h3>
          <p className="text-muted-foreground text-sm">Create your first job posting using the form.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <div key={job.id} className={`border rounded-lg p-5 transition-all ${job.status === 'published' ? 'border-border bg-card' : 'border-border bg-muted/30'}`}>
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="text-lg font-semibold text-foreground">{job.title}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors[job.status] || statusColors.draft}`}>
                      {job.status}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                      {job.visibility === 'external' ? 'External' : 'Internal'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{job.location}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{job.type}</span>
                    {job.department && <span>· {job.department}</span>}
                    {job.experience_level && <span>· {job.experience_level}</span>}
                  </div>
                  <p className="text-sm text-foreground/70 mt-2 line-clamp-2">{job.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-border flex-wrap">
                <select
                  value={job.status}
                  onChange={(e) => handleStatusChange(job.id, e.target.value)}
                  className="px-3 py-1.5 text-sm font-medium border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary outline-none"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="paused">Paused</option>
                  <option value="closed">Closed</option>
                </select>
                <button onClick={() => handleDelete(job.id)} className="px-3 py-1.5 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
                  Delete
                </button>
                <span className="ml-auto text-xs text-muted-foreground">{new Date(job.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
