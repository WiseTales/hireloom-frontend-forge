import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Users, FileText, ChevronDown, ChevronUp, Briefcase as BriefcaseIcon, Sparkles, Download, Eye, BarChart3, ArrowUpDown, Loader2 } from 'lucide-react';

interface Job {
  id: string;
  title: string;
  location: string;
  type: string;
  description?: string;
  requirements?: string[];
  skills_required?: string[];
  responsibilities?: string[];
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

interface MatchAnalysis {
  match_score: number;
  summary: string;
  strengths: string[];
  gaps: string[];
  recommendation: string;
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
  'interview scheduled': 'bg-amber-100 text-amber-800',
  'rejected': 'bg-destructive/10 text-destructive',
  'hired': 'bg-green-100 text-green-800',
};

const recommendationLabels: Record<string, { label: string; color: string }> = {
  strong_match: { label: 'Strong Match', color: 'bg-green-100 text-green-800' },
  good_match: { label: 'Good Match', color: 'bg-blue-100 text-blue-800' },
  partial_match: { label: 'Partial Match', color: 'bg-amber-100 text-amber-800' },
  weak_match: { label: 'Weak Match', color: 'bg-red-100 text-red-800' },
};

function ScoreBar({ score }: { score: number }) {
  const color = score >= 75 ? 'bg-green-500' : score >= 50 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-bold text-foreground">{score}%</span>
    </div>
  );
}

export default function ApplicantsList({ jobs, applications, onRefresh }: ApplicantsListProps) {
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [atsScores, setAtsScores] = useState<Record<string, MatchAnalysis>>({});
  const [atsLoading, setAtsLoading] = useState<Record<string, boolean>>({});
  const [bulkLoading, setBulkLoading] = useState<Record<string, boolean>>({});
  const [expandedAnalysis, setExpandedAnalysis] = useState<Record<string, boolean>>({});
  const [sortByScore, setSortByScore] = useState<Record<string, boolean>>({});

  const getApplicationsForJob = (jobId: string) => {
    const jobApps = applications.filter(a => a.job_id === jobId);
    if (sortByScore[jobId]) {
      return [...jobApps].sort((a, b) => {
        const scoreA = atsScores[a.id]?.match_score ?? -1;
        const scoreB = atsScores[b.id]?.match_score ?? -1;
        return scoreB - scoreA;
      });
    }
    return jobApps;
  };

  const handleStatusChange = async (appId: string, newStatus: string) => {
    await (supabase.from('public_applications') as any).update({ status: newStatus.toLowerCase() }).eq('id', appId);
    onRefresh();
  };

  const fetchResumeBase64 = async (resumeUrl: string): Promise<string | null> => {
    try {
      const res = await fetch(resumeUrl);
      if (!res.ok) return null;
      const blob = await res.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = reader.result as string;
          resolve(dataUrl.split(',')[1]);
        };
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  };

  const runATSCheck = async (app: PublicApplication, job: Job) => {
    if (atsScores[app.id] || atsLoading[app.id]) return;
    setAtsLoading(prev => ({ ...prev, [app.id]: true }));

    try {
      if (!app.resume_url || app.resume_url === 'not_provided') {
        setAtsScores(prev => ({
          ...prev,
          [app.id]: { match_score: 0, summary: 'No resume provided.', strengths: [], gaps: ['Resume not uploaded'], recommendation: 'weak_match' },
        }));
        return;
      }

      const base64 = await fetchResumeBase64(app.resume_url);
      if (!base64) {
        setAtsScores(prev => ({
          ...prev,
          [app.id]: { match_score: 0, summary: 'Could not read resume.', strengths: [], gaps: ['Resume inaccessible'], recommendation: 'weak_match' },
        }));
        return;
      }

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/ai-resume-match`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          resume_base64: base64,
          job_title: job.title,
          job_description: job.description || '',
          job_requirements: job.requirements || [],
          job_skills: job.skills_required || [],
          job_responsibilities: job.responsibilities || [],
        }),
      });

      if (!res.ok) throw new Error('ATS check failed');
      const data = await res.json();
      if (data.analysis) {
        setAtsScores(prev => ({ ...prev, [app.id]: data.analysis }));
      }
    } catch {
      setAtsScores(prev => ({
        ...prev,
        [app.id]: { match_score: 0, summary: 'Analysis failed. Try again later.', strengths: [], gaps: [], recommendation: 'partial_match' },
      }));
    } finally {
      setAtsLoading(prev => ({ ...prev, [app.id]: false }));
    }
  };

  const runBulkATS = async (job: Job) => {
    const jobApps = applications.filter(a => a.job_id === job.id);
    const unscored = jobApps.filter(a => !atsScores[a.id] && !atsLoading[a.id]);
    if (unscored.length === 0) {
      setSortByScore(prev => ({ ...prev, [job.id]: true }));
      return;
    }

    setBulkLoading(prev => ({ ...prev, [job.id]: true }));
    for (const app of unscored) {
      await runATSCheck(app, job);
      // Small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 800));
    }
    setBulkLoading(prev => ({ ...prev, [job.id]: false }));
    setSortByScore(prev => ({ ...prev, [job.id]: true }));
  };

  const getDisplayStatus = (status: string | null) => {
    if (!status || status === 'pending') return 'New';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const scoredCount = (jobId: string) => applications.filter(a => a.job_id === jobId && atsScores[a.id]).length;

  return (
    <div className="bg-card rounded-xl shadow-sm border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-heading font-semibold text-foreground">Applications & ATS</h2>
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
          {jobs.filter(j => applications.some(a => a.job_id === j.id)).map((job) => {
            const jobApps = getApplicationsForJob(job.id);
            const isExpanded = expandedJobId === job.id;
            const scored = scoredCount(job.id);
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
                    {scored > 0 && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                        {scored} scored
                      </span>
                    )}
                    <span className="px-2.5 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                      {jobApps.length} applicant{jobApps.length !== 1 ? 's' : ''}
                    </span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-border">
                    {/* Bulk ATS + Sort controls */}
                    <div className="flex items-center gap-2 px-5 py-3 bg-muted/30 border-b border-border">
                      <button
                        onClick={() => runBulkATS(job)}
                        disabled={bulkLoading[job.id]}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                      >
                        {bulkLoading[job.id] ? <Loader2 className="w-3 h-3 animate-spin" /> : <BarChart3 className="w-3 h-3" />}
                        {bulkLoading[job.id] ? 'Scoring...' : 'Score All & Rank'}
                      </button>
                      {scored > 0 && (
                        <button
                          onClick={() => setSortByScore(prev => ({ ...prev, [job.id]: !prev[job.id] }))}
                          className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                            sortByScore[job.id] ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          <ArrowUpDown className="w-3 h-3" />
                          {sortByScore[job.id] ? 'Sorted by ATS' : 'Sort by ATS Score'}
                        </button>
                      )}
                    </div>

                    {/* Table header */}
                    <div className="hidden md:grid grid-cols-8 gap-2 px-5 py-2 bg-muted/50 text-xs font-medium text-muted-foreground">
                      {sortByScore[job.id] && <span className="col-span-1">#</span>}
                      <span className="col-span-1">Name</span>
                      <span className="col-span-1">Email</span>
                      <span className={sortByScore[job.id] ? 'col-span-1' : 'col-span-1'}>Resume</span>
                      <span className="col-span-1">ATS Score</span>
                      <span className="col-span-1">Date</span>
                      <span className="col-span-1">Status</span>
                      <span className="col-span-1">Actions</span>
                    </div>

                    {jobApps.map((app, idx) => {
                      const analysis = atsScores[app.id];
                      const isAnalysisExpanded = expandedAnalysis[app.id];
                      const rec = analysis ? recommendationLabels[analysis.recommendation] : null;

                      return (
                        <div key={app.id} className="border-b border-border last:border-b-0">
                          <div className="md:grid md:grid-cols-8 gap-2 px-5 py-4 items-center">
                            {sortByScore[job.id] && (
                              <div className="col-span-1">
                                <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                                  idx === 0 ? 'bg-yellow-100 text-yellow-800' : idx === 1 ? 'bg-gray-200 text-gray-700' : idx === 2 ? 'bg-orange-100 text-orange-800' : 'bg-muted text-muted-foreground'
                                }`}>
                                  {idx + 1}
                                </span>
                              </div>
                            )}
                            <div className="col-span-1">
                              <h4 className="text-sm font-semibold text-foreground">{app.full_name}</h4>
                              {app.phone && <p className="text-xs text-muted-foreground">{app.phone}</p>}
                            </div>
                            <div className="col-span-1">
                              <p className="text-xs text-muted-foreground truncate">{app.email}</p>
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
                              {analysis ? (
                                <button onClick={() => setExpandedAnalysis(prev => ({ ...prev, [app.id]: !prev[app.id] }))} className="text-left">
                                  <ScoreBar score={analysis.match_score} />
                                  {rec && <span className={`mt-1 inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${rec.color}`}>{rec.label}</span>}
                                </button>
                              ) : atsLoading[app.id] ? (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Loader2 className="w-3 h-3 animate-spin" /> Scoring...
                                </div>
                              ) : (
                                <button
                                  onClick={() => runATSCheck(app, job)}
                                  className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                >
                                  <BarChart3 className="w-3 h-3" /> Check
                                </button>
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
                            <div className="col-span-1 flex items-center gap-1">
                              {app.linkedin_url && (
                                <a href={app.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">LinkedIn</a>
                              )}
                              {app.portfolio_url && (
                                <a href={app.portfolio_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">Portfolio</a>
                              )}
                            </div>
                          </div>

                          {/* Expanded ATS Analysis */}
                          {analysis && isAnalysisExpanded && (
                            <div className="px-5 pb-4">
                              <div className="bg-primary/5 border border-primary/10 rounded-lg p-4 space-y-3">
                                <div className="flex items-center gap-2 mb-2">
                                  <Sparkles className="w-4 h-4 text-primary" />
                                  <span className="text-sm font-semibold text-primary">ATS Analysis</span>
                                  <span className="ml-auto text-lg font-bold text-foreground">{analysis.match_score}%</span>
                                </div>
                                <p className="text-sm text-foreground/80">{analysis.summary}</p>

                                {analysis.strengths.length > 0 && (
                                  <div>
                                    <p className="text-xs font-semibold text-green-700 mb-1">✓ Strengths</p>
                                    <ul className="space-y-1">
                                      {analysis.strengths.map((s, i) => (
                                        <li key={i} className="text-xs text-foreground/70 pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-green-500">{s}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {analysis.gaps.length > 0 && (
                                  <div>
                                    <p className="text-xs font-semibold text-red-700 mb-1">✗ Gaps</p>
                                    <ul className="space-y-1">
                                      {analysis.gaps.map((g, i) => (
                                        <li key={i} className="text-xs text-foreground/70 pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-red-500">{g}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Cover letter */}
                          {app.cover_letter && (
                            <div className="px-5 pb-4">
                              <div className="bg-muted/50 rounded-lg p-3">
                                <p className="text-xs font-medium text-muted-foreground mb-1">Cover Letter</p>
                                <p className="text-sm text-foreground/70">{app.cover_letter}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
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
