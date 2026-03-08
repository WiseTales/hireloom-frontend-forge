import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Clock, DollarSign, Briefcase, Building2, Globe } from 'lucide-react';
import { motion } from 'framer-motion';

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
  department: string | null;
  location: string;
  location_type: string | null;
  salary: string | null;
  type: string;
  category: string;
  experience_level: string | null;
  description: string;
  created_at: string;
}

export default function CareersPage() {
  const { companySlug } = useParams<{ companySlug: string }>();
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [jobs, setJobs] = useState<JobData[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!companySlug) return;
    const fetchData = async () => {
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
        setJobs(data.jobs || []);
      } catch {
        setNotFound(true);
      }
      setLoading(false);
    };
    fetchData();
  }, [companySlug]);

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
          {company?.description && <p className="text-white/70 max-w-2xl mt-4">{company.description}</p>}
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
              >
                <Link
                  to={`/careers/${companySlug}/${job.id}`}
                  className="block bg-card rounded-xl shadow-sm border border-border p-6 hover:shadow-md hover:border-primary/20 transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h2 className="text-xl font-heading font-semibold text-foreground mb-2">{job.title}</h2>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-3">
                        {job.department && (
                          <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" />{job.department}</span>
                        )}
                        <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{job.location}</span>
                        {job.location_type && (
                          <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5" />{locationTypeLabel(job.location_type)}</span>
                        )}
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{job.type}</span>
                        {job.salary && <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" />{job.salary}</span>}
                      </div>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {job.experience_level && (
                          <span className="px-2.5 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium">{job.experience_level}</span>
                        )}
                        {job.category && (
                          <span className="px-2.5 py-0.5 bg-muted text-muted-foreground rounded-full text-xs font-medium">{job.category}</span>
                        )}
                      </div>
                      <p className="text-foreground/70 text-sm line-clamp-2">{job.description}</p>
                    </div>
                    <span className="px-5 py-2.5 bg-primary text-primary-foreground font-medium rounded-lg text-sm whitespace-nowrap shrink-0">
                      View Job
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <footer className="py-6 border-t border-border text-center">
        <p className="text-sm text-muted-foreground">Powered by <Link to="/" className="font-semibold text-primary hover:underline">HireLoom</Link></p>
      </footer>
    </div>
  );
}
