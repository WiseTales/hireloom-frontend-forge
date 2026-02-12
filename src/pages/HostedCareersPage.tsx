import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, MapPin, Briefcase } from 'lucide-react';

interface Job {
  id: string;
  title: string;
  location: string;
  type: string;
  description: string;
}

export default function HostedCareersPage() {
  const { companySlug } = useParams<{ companySlug: string }>();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (companySlug) {
      fetchJobs();
    }
  }, [companySlug]);

  const fetchJobs = async () => {
    try {
      setLoading(true);

      // Fetch company details
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('id, name')
        .eq('slug', companySlug)
        .single();

      if (companyError || !company) {
        setError('Company not found');
        return;
      }

      setCompanyName(company.name);

      // Fetch jobs using public-api or direct supabase (direct is easier since we have company id)
      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs')
        .select('id, title, location, type, description')
        .eq('company_id', company.id)
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (jobsError) throw jobsError;
      setJobs(jobsData || []);
    } catch (err: any) {
      console.error('Error fetching jobs:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error || !companySlug) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="max-w-md w-full shadow-lg border-0">
          <CardContent className="py-12 text-center">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">{error || 'Something went wrong'}</h2>
            <p className="text-slate-600">Please check the URL and try again.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">{companyName} <span className="text-indigo-600">Careers</span></h1>
          <span className="text-xs font-medium text-slate-400 uppercase tracking-widest hidden sm:inline">Powered by HireLoom</span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="mb-12 text-center">
          <h2 className="text-4xl font-extrabold text-slate-900 mb-4">Join Our Team</h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            We're building something special at {companyName} and we're looking for talented people to join us.
          </p>
        </div>

        {jobs.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-slate-500 mb-2 text-lg">No open positions at the moment.</p>
            <p className="text-slate-400 text-sm">Please check back later!</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {jobs.map((job) => (
              <Link key={job.id} to={`/company/${companySlug}/${job.id}`}>
                <Card className="hover:shadow-md transition-all border-slate-100 group border-l-0 overflow-hidden relative">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-2">
                        <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{job.title}</h3>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                          <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{job.location}</span>
                          <span className="flex items-center gap-1.5"><Briefcase className="h-4 w-4" />{job.type}</span>
                        </div>
                      </div>
                      <Badge variant="secondary" className="w-fit bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-0">View Details & Apply</Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>

      <footer className="py-12 border-t mt-20 bg-white">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} {companyName}. All rights reserved.
          </p>
          <p className="text-xs text-slate-400 mt-2 flex items-center justify-center gap-1">
            Technology by <span className="font-bold text-indigo-600">HireLoom</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
