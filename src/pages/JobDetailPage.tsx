import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Clock, DollarSign, Building2, Globe, ArrowLeft, CheckCircle, Calendar, User } from 'lucide-react';
import ApplicationModal from '@/components/careers/ApplicationModal';

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
  const [showApply, setShowApply] = useState(false);

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
            <section>
              <h2 className="text-xl font-heading font-semibold text-foreground mb-4">About this Role</h2>
              <p className="text-foreground/80 leading-relaxed whitespace-pre-line">{job.description}</p>
            </section>

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

            {job.benefits && job.benefits.length > 0 && (
              <section>
                <h2 className="text-xl font-heading font-semibold text-foreground mb-4">Benefits</h2>
                <ul className="space-y-2">
                  {job.benefits.map((b, i) => (
                    <li key={i} className="flex items-start gap-2 text-foreground/80">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-1 shrink-0" />
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
                onClick={() => setShowApply(true)}
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

      {/* Application Modal with AI Match */}
      <ApplicationModal
        show={showApply}
        onClose={() => setShowApply(false)}
        job={job}
        company={company}
        companySlug={companySlug || ''}
      />
    </div>
  );
}
