import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Users, FileText, ChevronDown, ChevronUp, Briefcase as BriefcaseIcon, Sparkles, Download, Eye } from 'lucide-react';

interface Job {
  id: string;
  title: string;
  location: string;
  type: string;
}

interface PublicApplication {
  id: string;
  job_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  resume_url: string;
  cover_letter: string | null;
  linkedin_url: string | null;
  portfolio_url: string | null;
  status: string | null;
  source: string | null;
  created_at: string | null;
}

interface ApplicantsListProps {
  jobs: Job[];
  applications: PublicApplication[];
  onRefresh: () => void;
}

const statusOptions = ['New', 'Shortlisted', 'Interview Scheduled', 'Rejected', 'Hired'];
const statusColors: Record<string, string> = {
  'new': 'bg-blue-100 text-blue-800',
  'pending': 'bg-blue-100 text-blue-800',
  'shortlisted': 'bg-primary/10 text-primary',
  'interview scheduled': 'bg-warning/10 text-warning',
  'rejected': 'bg-destructive/10 text-destructive',
  'hired': 'bg-green-100 text-green-800',
};

export default function ApplicantsList({ jobs, applications, onRefresh }: ApplicantsListProps) {
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [aiSummary, setAiSummary] = useState<Record<string, string>>({});
  const [aiLoading, setAiLoading] = useState<Record<string, boolean>>({});

  const getApplicationsForJob = (jobId: string) => applications.filter(a => a.job_id === jobId);

  const handleStatusChange = async (appId: string, newStatus: string) => {
    await (supabase.from('public_applications') as any).update({ status: newStatus.toLowerCase() }).eq('id', appId);
    onRefresh();
  };

  const handleAISummary = async (app: PublicApplication) => {
    if (aiSummary[app.id]) return;
    setAiLoading(prev => ({ ...prev, [app.id]: true }));

    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/ai-resume-summary`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: JSON.stringify({
            full_name: app.full_name,
            email: app.email,
            resume_url: app.resume_url,
            cover_letter: app.cover_letter,
            linkedin_url: app.linkedin_url,
          }),
        }
      );

      if (!res.ok) throw new Error('AI summary failed');
      const data = await res.json();
      setAiSummary(prev => ({ ...prev, [app.id]: data.summary }));
    } catch {
      setAiSummary(prev => ({ ...prev, [app.id]: 'Unable to generate summary.' }));
    }
    setAiLoading(prev => ({ ...prev, [app.id]: false }));
  };

  const getDisplayStatus = (status: string | null) => {
    if (!status || status === 'pending') return 'New';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className="bg-card rounded-xl shadow-sm border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-heading font-semibold text-foreground">Applications</h2>
        <span className="text-sm text-muted-foreground">{applications.length} total</span>
      </div>

      {applications.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No applications yet</h3>
          <p className="text-muted-foreground text-sm">Applications from your career page will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.filter(j => getApplicationsForJob(j.id).length > 0).map((job) => {
            const jobApps = getApplicationsForJob(job.id);
            const isExpanded = expandedJobId === job.id;
            return (
              <div key={job.id} className="border border-border rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedJobId(isExpanded ? null : job.id)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <BriefcaseIcon className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">{job.title}</h3>
                      <p className="text-xs text-muted-foreground">{job.location} · {job.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                      {jobApps.length} applicant{jobApps.length !== 1 ? 's' : ''}
                    </span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-border">
                    {/* Table header */}
                    <div className="hidden md:grid grid-cols-7 gap-2 px-5 py-2 bg-muted/50 text-xs font-medium text-muted-foreground">
                      <span className="col-span-1">Name</span>
                      <span className="col-span-1">Email</span>
                      <span className="col-span-1">Phone</span>
                      <span className="col-span-1">Resume</span>
                      <span className="col-span-1">Date</span>
                      <span className="col-span-1">Status</span>
                      <span className="col-span-1">Actions</span>
                    </div>

                    {jobApps.map((app) => (
                      <div key={app.id} className="border-b border-border last:border-b-0">
                        <div className="md:grid md:grid-cols-7 gap-2 px-5 py-4 items-center">
                          <div className="col-span-1">
                            <h4 className="text-sm font-semibold text-foreground">{app.full_name}</h4>
                          </div>
                          <div className="col-span-1">
                            <p className="text-xs text-muted-foreground truncate">{app.email}</p>
                          </div>
                          <div className="col-span-1">
                            <p className="text-xs text-muted-foreground">{app.phone || '—'}</p>
                          </div>
                          <div className="col-span-1 flex items-center gap-1">
                            {app.resume_url && app.resume_url !== 'not_provided' ? (
                              <>
                                <a href={app.resume_url} target="_blank" rel="noopener noreferrer"
                                  className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-primary hover:bg-primary/10 rounded transition-colors">
                                  <Eye className="w-3 h-3" /> View
                                </a>
                                <a href={app.resume_url} download
                                  className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted rounded transition-colors">
                                  <Download className="w-3 h-3" />
                                </a>
                              </>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </div>
                          <div className="col-span-1">
                            <p className="text-xs text-muted-foreground">
                              {app.created_at ? new Date(app.created_at).toLocaleDateString() : '—'}
                            </p>
                          </div>
                          <div className="col-span-1">
                            <select
                              value={getDisplayStatus(app.status)}
                              onChange={(e) => handleStatusChange(app.id, e.target.value)}
                              className={`px-2 py-1 rounded-lg text-xs font-medium border-0 outline-none cursor-pointer ${statusColors[(app.status || 'new').toLowerCase()] || statusColors.new}`}
                            >
                              {statusOptions.map(s => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                          </div>
                          <div className="col-span-1">
                            <button
                              onClick={() => handleAISummary(app)}
                              disabled={aiLoading[app.id]}
                              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors disabled:opacity-50"
                            >
                              <Sparkles className="w-3 h-3" />
                              {aiLoading[app.id] ? '...' : 'AI Summary'}
                            </button>
                          </div>
                        </div>

                        {/* AI Summary & Cover Letter */}
                        {(aiSummary[app.id] || app.cover_letter) && (
                          <div className="px-5 pb-4 space-y-2">
                            {aiSummary[app.id] && (
                              <div className="bg-primary/5 border border-primary/10 rounded-lg p-3">
                                <p className="text-xs font-medium text-primary mb-1 flex items-center gap-1"><Sparkles className="w-3 h-3" /> AI Summary</p>
                                <p className="text-sm text-foreground/80">{aiSummary[app.id]}</p>
                              </div>
                            )}
                            {app.cover_letter && (
                              <div className="bg-muted/50 rounded-lg p-3">
                                <p className="text-xs font-medium text-muted-foreground mb-1">Cover Letter</p>
                                <p className="text-sm text-foreground/70">{app.cover_letter}</p>
                              </div>
                            )}
                            {app.linkedin_url && (
                              <a href={app.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">LinkedIn Profile →</a>
                            )}
                            {app.portfolio_url && (
                              <a href={app.portfolio_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline ml-3">Portfolio →</a>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
