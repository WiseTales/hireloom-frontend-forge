import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Clock, DollarSign, Building2, Globe, ArrowLeft, CheckCircle, X, Calendar, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface JobDetail {
  id: string;
  title: string;
  department: string | null;
  location: string;
  location_type: string | null;
  salary: string | null;
  type: string;
  category: string;
  experience_level: string | null;
  experience_required: string | null;
  description: string;
  responsibilities: string[] | null;
  requirements: string[] | null;
  benefits: string[] | null;
  skills_required: string[] | null;
  application_deadline: string | null;
  hiring_manager_name: string | null;
  created_at: string;
}

interface CompanyData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
}

export default function JobDetailPage() {
  const { companySlug, jobId } = useParams<{ companySlug: string; jobId: string }>();
  const [job, setJob] = useState<JobDetail | null>(null);
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Apply modal
  const [showApply, setShowApply] = useState(false);
  const [appForm, setAppForm] = useState({ full_name: '', email: '', phone: '', cover_letter: '', linkedin_url: '', portfolio_url: '' });
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (!companySlug || !jobId) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
        const res = await fetch(
          `https://${projectId}.supabase.co/functions/v1/public-jobs?companySlug=${companySlug}&jobId=${jobId}`,
          { headers: { 'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY } }
        );
        if (!res.ok) { setNotFound(true); setLoading(false); return; }
        const data = await res.json();
        setCompany(data.company);
        if (data.job) {
          setJob(data.job);
        } else if (data.jobs?.length > 0) {
          const found = data.jobs.find((j: any) => j.id === jobId);
          if (found) setJob(found); else setNotFound(true);
        } else {
          setNotFound(true);
        }
      } catch {
        setNotFound(true);
      }
      setLoading(false);
    };
    fetchData();
  }, [companySlug, jobId]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!job || !companySlug) return;
    setSubmitting(true);
    setSubmitError('');

    let resumeUrl = 'not_provided';

    // Upload resume if provided
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

  const locationTypeLabel = (lt: string | null) => {
    if (!lt) return null;
    const map: Record<string, string> = { onsite: 'On-site', hybrid: 'Hybrid', remote: 'Remote' };
    return map[lt] || lt;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (notFound || !job) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-6xl font-heading font-bold text-foreground mb-4">404</h1>
          <p className="text-muted-foreground mb-6">Job not found</p>
          <Link to={`/careers/${companySlug}`} className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity">
            Back to Jobs
          </Link>
        </div>
      </div>
    );
  }

  const inputClass = "w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm bg-background text-foreground";

  return (
    <div className="min-h-screen bg-secondary/30">
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, hsl(153 60% 28%), hsl(153 60% 42%))' }} className="py-12">
        <div className="max-w-4xl mx-auto px-6">
          <Link to={`/careers/${companySlug}`} className="inline-flex items-center gap-1 text-white/70 hover:text-white text-sm mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> All Jobs at {company?.name}
          </Link>
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-white mb-3">{job.title}</h1>
          <div className="flex flex-wrap items-center gap-3 text-white/80 text-sm">
            {job.department && <span className="flex items-center gap-1"><Building2 className="w-4 h-4" />{job.department}</span>}
            <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{job.location}</span>
            {job.location_type && <span className="flex items-center gap-1"><Globe className="w-4 h-4" />{locationTypeLabel(job.location_type)}</span>}
            <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{job.type}</span>
            {job.salary && <span className="flex items-center gap-1"><DollarSign className="w-4 h-4" />{job.salary}</span>}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <section>
              <h2 className="text-xl font-heading font-semibold text-foreground mb-4">About this Role</h2>
              <p className="text-foreground/80 leading-relaxed whitespace-pre-line">{job.description}</p>
            </section>

            {/* Responsibilities */}
            {job.responsibilities && job.responsibilities.length > 0 && (
              <section>
                <h2 className="text-xl font-heading font-semibold text-foreground mb-4">Responsibilities</h2>
                <ul className="space-y-2">
                  {job.responsibilities.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-foreground/80">
                      <CheckCircle className="w-4 h-4 text-primary mt-1 shrink-0" />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Requirements */}
            {job.requirements && job.requirements.length > 0 && (
              <section>
                <h2 className="text-xl font-heading font-semibold text-foreground mb-4">Requirements</h2>
                <ul className="space-y-2">
                  {job.requirements.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-foreground/80">
                      <CheckCircle className="w-4 h-4 text-primary mt-1 shrink-0" />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Skills */}
            {job.skills_required && job.skills_required.length > 0 && (
              <section>
                <h2 className="text-xl font-heading font-semibold text-foreground mb-4">Required Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {job.skills_required.map((s, i) => (
                    <span key={i} className="px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium">{s}</span>
                  ))}
                </div>
              </section>
            )}

            {/* Benefits */}
            {job.benefits && job.benefits.length > 0 && (
              <section>
                <h2 className="text-xl font-heading font-semibold text-foreground mb-4">Benefits</h2>
                <ul className="space-y-2">
                  {job.benefits.map((b, i) => (
                    <li key={i} className="flex items-start gap-2 text-foreground/80">
                      <CheckCircle className="w-4 h-4 text-success mt-1 shrink-0" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-card rounded-xl border border-border p-6 sticky top-8 space-y-4">
              <button
                onClick={() => { setShowApply(true); setSubmitSuccess(false); setSubmitError(''); }}
                className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity"
              >
                Apply Now
              </button>

              <div className="space-y-3 text-sm">
                {job.experience_level && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Experience Level</span>
                    <span className="font-medium text-foreground">{job.experience_level}</span>
                  </div>
                )}
                {job.experience_required && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Experience</span>
                    <span className="font-medium text-foreground">{job.experience_required}</span>
                  </div>
                )}
                {job.category && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Category</span>
                    <span className="font-medium text-foreground">{job.category}</span>
                  </div>
                )}
                {job.application_deadline && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />Deadline</span>
                    <span className="font-medium text-foreground">{new Date(job.application_deadline).toLocaleDateString()}</span>
                  </div>
                )}
                {job.hiring_manager_name && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground flex items-center gap-1"><User className="w-3.5 h-3.5" />Hiring Manager</span>
                    <span className="font-medium text-foreground">{job.hiring_manager_name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="py-6 border-t border-border text-center">
        <p className="text-sm text-muted-foreground">Powered by <Link to="/" className="font-semibold text-primary hover:underline">HireLoom</Link></p>
      </footer>

      {/* Application Modal */}
      <AnimatePresence>
        {showApply && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-foreground/60 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-heading font-bold text-foreground">Apply for {job.title}</h2>
                  <p className="text-sm text-muted-foreground mt-1">{company?.name}</p>
                </div>
                <button onClick={() => setShowApply(false)} className="p-2 hover:bg-muted rounded-lg transition-colors">
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
                  <button onClick={() => setShowApply(false)} className="mt-6 px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity text-sm">Close</button>
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
                    <input type="file" accept=".pdf" onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                      className="w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
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
    </div>
  );
}
