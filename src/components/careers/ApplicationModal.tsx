import { useState } from 'react';
import { CheckCircle, X, Sparkles, Loader2, TrendingUp, TrendingDown, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MatchAnalysis {
  match_score: number;
  summary: string;
  strengths: string[];
  gaps: string[];
  recommendation: string;
}

interface ApplicationModalProps {
  show: boolean;
  onClose: () => void;
  job: {
    id: string;
    title: string;
    description: string;
    requirements?: string[] | null;
    skills_required?: string[] | null;
    responsibilities?: string[] | null;
  };
  company: { name: string; slug: string } | null;
  companySlug: string;
}

export default function ApplicationModal({ show, onClose, job, company, companySlug }: ApplicationModalProps) {
  const [appForm, setAppForm] = useState({ full_name: '', email: '', phone: '', cover_letter: '', linkedin_url: '', portfolio_url: '' });
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Match analysis state
  const [matchAnalysis, setMatchAnalysis] = useState<MatchAnalysis | null>(null);
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchError, setMatchError] = useState('');

  const handleCheckMatch = async () => {
    if (!resumeFile) return;
    setMatchLoading(true);
    setMatchError('');
    setMatchAnalysis(null);

    try {
      const arrayBuffer = await resumeFile.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/ai-resume-match`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            resume_base64: base64,
            job_title: job.title,
            job_description: job.description,
            job_requirements: job.requirements,
            job_skills: job.skills_required,
            job_responsibilities: job.responsibilities,
          }),
        }
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setMatchError(errData.error || 'Failed to analyze resume');
      } else {
        const data = await res.json();
        setMatchAnalysis(data.analysis);
      }
    } catch {
      setMatchError('Network error. Please try again.');
    }
    setMatchLoading(false);
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!job || !companySlug) return;
    setSubmitting(true);
    setSubmitError('');

    let resumeUrl = 'not_provided';

    if (resumeFile) {
      try {
        const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
        const formData = new FormData();
        formData.append('file', resumeFile);
        const uploadRes = await fetch(
          `https://${projectId}.supabase.co/functions/v1/upload-resume`,
          {
            method: 'POST',
            headers: { 'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
            body: formData,
          }
        );
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          resumeUrl = uploadData.url;
        }
      } catch {
        // Continue without resume
      }
    }

    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    try {
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/public-apply`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            job_id: job.id,
            company_slug: companySlug,
            full_name: appForm.full_name,
            email: appForm.email,
            phone: appForm.phone || undefined,
            resume_url: resumeUrl,
            cover_letter: appForm.cover_letter || undefined,
            linkedin_url: appForm.linkedin_url || undefined,
            portfolio_url: appForm.portfolio_url || undefined,
          }),
        }
      );
      if (!res.ok) {
        const errData = await res.json();
        setSubmitError(errData.error || 'Failed to submit application');
      } else {
        setSubmitSuccess(true);
      }
    } catch {
      setSubmitError('Network error. Please try again.');
    }
    setSubmitting(false);
  };

  const scoreColor = (score: number) => {
    if (score >= 75) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-500';
  };

  const recommendationLabel: Record<string, { label: string; color: string }> = {
    strong_match: { label: 'Strong Match', color: 'bg-green-100 text-green-700' },
    good_match: { label: 'Good Match', color: 'bg-blue-100 text-blue-700' },
    partial_match: { label: 'Partial Match', color: 'bg-yellow-100 text-yellow-700' },
    weak_match: { label: 'Weak Match', color: 'bg-red-100 text-red-700' },
  };

  const inputClass = "w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm bg-background text-foreground";

  return (
    <AnimatePresence>
      {show && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-foreground/60 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
            className="bg-card rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-heading font-bold text-foreground">Apply for {job.title}</h2>
                <p className="text-sm text-muted-foreground mt-1">{company?.name}</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {submitSuccess ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-heading font-semibold text-foreground mb-2">Application Submitted!</h3>
                <p className="text-muted-foreground text-sm">Thank you for applying. The hiring team will review your application.</p>
                <button onClick={onClose} className="mt-6 px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity text-sm">Close</button>
              </div>
            ) : (
              <form onSubmit={handleApply} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Full Name *</label>
                  <input value={appForm.full_name} onChange={(e) => setAppForm({ ...appForm, full_name: e.target.value })} required className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Email *</label>
                  <input type="email" value={appForm.email} onChange={(e) => setAppForm({ ...appForm, email: e.target.value })} required className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Phone</label>
                  <input value={appForm.phone} onChange={(e) => setAppForm({ ...appForm, phone: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Resume (PDF)</label>
                  <input type="file" accept=".pdf" onChange={(e) => { setResumeFile(e.target.files?.[0] || null); setMatchAnalysis(null); setMatchError(''); }}
                    className="w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />

                  {/* AI Match Check */}
                  {resumeFile && !matchAnalysis && (
                    <button
                      type="button"
                      onClick={handleCheckMatch}
                      disabled={matchLoading}
                      className="mt-2 flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {matchLoading ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing Resume...</>
                      ) : (
                        <><Sparkles className="w-4 h-4" /> Check Profile Match with AI</>
                      )}
                    </button>
                  )}
                  {matchError && <p className="text-destructive text-xs mt-1">{matchError}</p>}

                  {/* Match Results */}
                  {matchAnalysis && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-3 border border-border rounded-xl p-4 bg-muted/50 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Award className="w-5 h-5 text-primary" />
                          <span className="font-semibold text-foreground text-sm">AI Match Analysis</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-2xl font-bold ${scoreColor(matchAnalysis.match_score)}`}>
                            {matchAnalysis.match_score}%
                          </span>
                          {matchAnalysis.recommendation && recommendationLabel[matchAnalysis.recommendation] && (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${recommendationLabel[matchAnalysis.recommendation].color}`}>
                              {recommendationLabel[matchAnalysis.recommendation].label}
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="text-sm text-foreground/80">{matchAnalysis.summary}</p>

                      {matchAnalysis.strengths?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-foreground flex items-center gap-1 mb-1">
                            <TrendingUp className="w-3.5 h-3.5 text-green-600" /> Strengths
                          </p>
                          <ul className="space-y-0.5">
                            {matchAnalysis.strengths.map((s, i) => (
                              <li key={i} className="text-xs text-foreground/70 flex items-start gap-1.5">
                                <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 shrink-0" /> {s}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {matchAnalysis.gaps?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-foreground flex items-center gap-1 mb-1">
                            <TrendingDown className="w-3.5 h-3.5 text-yellow-600" /> Gaps
                          </p>
                          <ul className="space-y-0.5">
                            {matchAnalysis.gaps.map((g, i) => (
                              <li key={i} className="text-xs text-foreground/70 flex items-start gap-1.5">
                                <span className="w-3 h-3 flex items-center justify-center text-yellow-500 shrink-0">•</span> {g}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">LinkedIn URL</label>
                  <input value={appForm.linkedin_url} onChange={(e) => setAppForm({ ...appForm, linkedin_url: e.target.value })} className={inputClass} placeholder="https://linkedin.com/in/..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Portfolio URL</label>
                  <input value={appForm.portfolio_url} onChange={(e) => setAppForm({ ...appForm, portfolio_url: e.target.value })} className={inputClass} placeholder="https://..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Cover Letter</label>
                  <textarea value={appForm.cover_letter} onChange={(e) => setAppForm({ ...appForm, cover_letter: e.target.value })} rows={4}
                    className={`${inputClass} resize-none`} placeholder="Tell us why you're interested..." />
                </div>
                {submitError && <div className="bg-destructive/10 text-destructive px-3 py-2 rounded-lg text-sm">{submitError}</div>}
                <button type="submit" disabled={submitting}
                  className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 text-sm">
                  {submitting ? 'Submitting...' : 'Submit Application'}
                </button>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
