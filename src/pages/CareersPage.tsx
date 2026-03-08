import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Clock, DollarSign, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CompanyData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
}

interface JobData {
  id: string;
  title: string;
  location: string;
  salary: string | null;
  type: string;
  category: string;
  description: string;
  created_at: string;
}

export default function CareersPage() {
  const { companySlug } = useParams<{ companySlug: string }>();
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [jobs, setJobs] = useState<JobData[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Application modal
  const [applyingJob, setApplyingJob] = useState<JobData | null>(null);
  const [appForm, setAppForm] = useState({ full_name: '', email: '', phone: '', cover_letter: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (!companySlug) return;
    fetchCareerData();
  }, [companySlug]);

  const fetchCareerData = async () => {
    setLoading(true);
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/public-jobs?companySlug=${companySlug}`,
        { headers: { 'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY } }
      );

      if (!res.ok) { setNotFound(true); setLoading(false); return; }

      const data = await res.json();
      setCompany(data.company);
      const mappedJobs = (data.jobs || []).map((j: any) => ({
        id: j.jobId || j.id,
        title: j.title,
        location: j.location,
        salary: j.salary_range || j.salary || null,
        type: j.job_type || j.employmentType || j.type || '',
        category: j.category || '',
        description: j.description,
        created_at: j.postedAt || j.created_at,
      }));
      setJobs(mappedJobs);
    } catch {
      setNotFound(true);
    }
    setLoading(false);
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyingJob || !companySlug) return;
    setSubmitting(true);
    setSubmitError('');

    const resumeUrl = 'not_provided';

    // Submit application via edge function
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
            job_id: applyingJob.id,
            company_slug: companySlug,
            full_name: appForm.full_name,
            email: appForm.email,
            phone: appForm.phone || undefined,
            resume_url: resumeUrl || 'not_provided',
            cover_letter: appForm.cover_letter || undefined,
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-6xl font-heading font-bold text-foreground mb-4">404</h1>
          <p className="text-muted-foreground mb-6">Company not found</p>
          <Link to="/" className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity">Back to Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30">
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, hsl(153 60% 28%), hsl(153 60% 42%))' }} className="py-16">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex items-center gap-4 mb-4">
            {company?.logo_url && (
              <img src={company.logo_url} alt={company.name} className="w-16 h-16 rounded-xl bg-white/10 object-contain" />
            )}
            <div>
              <h1 className="text-4xl md:text-5xl font-heading font-bold text-white">{company?.name}</h1>
              <p className="text-white/80 text-lg mt-1">Career Opportunities</p>
            </div>
          </div>
          {company?.description && (
            <p className="text-white/70 max-w-2xl mt-4">{company.description}</p>
          )}
        </div>
      </div>

      {/* Jobs */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        {jobs.length === 0 ? (
          <div className="bg-card rounded-2xl shadow-sm border border-border p-12 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-heading font-semibold text-foreground mb-2">No open positions currently</h3>
            <p className="text-muted-foreground">Check back soon for new opportunities at {company?.name}.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground mb-2">{jobs.length} open position{jobs.length !== 1 ? 's' : ''}</p>
            {jobs.map((job, i) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card rounded-xl shadow-sm border border-border p-8 hover:shadow-md hover:border-primary/20 transition-all"
              >
                <div className="flex items-start justify-between gap-6">
                  <div className="flex-1">
                    <h2 className="text-2xl font-heading font-semibold text-foreground mb-3">{job.title}</h2>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                      <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{job.location}</span>
                      {job.type && <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{job.type}</span>}
                      {job.salary && <span className="flex items-center gap-1"><DollarSign className="w-4 h-4" />{job.salary}</span>}
                      {job.category && <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium">{job.category}</span>}
                    </div>
                    <p className="text-foreground/80 leading-relaxed line-clamp-3">{job.description}</p>
                  </div>
                  <button
                    onClick={() => { setApplyingJob(job); setSubmitSuccess(false); setSubmitError(''); setAppForm({ full_name: '', email: '', phone: '', cover_letter: '' }); setResumeFile(null); }}
                    className="px-6 py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap"
                  >
                    Apply Now
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Powered by */}
      <footer className="py-6 border-t border-border text-center">
        <p className="text-sm text-muted-foreground">Powered by <Link to="/" className="font-semibold text-primary hover:underline">HireLoom</Link></p>
      </footer>

      {/* Application Modal */}
      <AnimatePresence>
        {applyingJob && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-foreground/60 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-heading font-bold text-foreground">Apply for {applyingJob.title}</h2>
                  <p className="text-sm text-muted-foreground mt-1">{company?.name}</p>
                </div>
                <button onClick={() => setApplyingJob(null)} className="p-2 hover:bg-muted rounded-lg transition-colors">
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              {submitSuccess ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <h3 className="text-xl font-heading font-semibold text-foreground mb-2">Application Submitted!</h3>
                  <p className="text-muted-foreground text-sm">Thank you for applying. The hiring team will review your application.</p>
                  <button onClick={() => setApplyingJob(null)} className="mt-6 px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity text-sm">Close</button>
                </div>
              ) : (
                <form onSubmit={handleApply} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Full Name *</label>
                    <input value={appForm.full_name} onChange={(e) => setAppForm({ ...appForm, full_name: e.target.value })} required
                      className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Email *</label>
                    <input type="email" value={appForm.email} onChange={(e) => setAppForm({ ...appForm, email: e.target.value })} required
                      className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Phone</label>
                    <input value={appForm.phone} onChange={(e) => setAppForm({ ...appForm, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Resume *</label>
                    <label className="flex items-center gap-2 px-3 py-3 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                      <Upload className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{resumeFile ? resumeFile.name : 'Click to upload resume (PDF, DOC)'}</span>
                      <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => setResumeFile(e.target.files?.[0] || null)} />
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Cover Letter</label>
                    <textarea value={appForm.cover_letter} onChange={(e) => setAppForm({ ...appForm, cover_letter: e.target.value })} rows={4}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm resize-none" placeholder="Tell us why you're interested..." />
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
