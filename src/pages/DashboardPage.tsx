import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/src/integrations/supabase/client';
import { LogOut } from 'lucide-react';

interface Job {
  id: string;
  title: string;
  location: string;
  salary: string | null;
  type: string;
  category: string;
  description: string;
  is_published: boolean;
  visibility: string;
  created_at: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [companyInfo, setCompanyInfo] = useState<any>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [salary, setSalary] = useState('');
  const [jobType, setJobType] = useState('Full-time');
  const [category, setCategory] = useState('Engineering');
  const [visibility, setVisibility] = useState<'external' | 'internal'>('external');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchData = useCallback(async (userId: string) => {
    // Get user's company via company_users
    const { data: companyUser } = await supabase
      .from('company_users')
      .select('company_id, companies(id, name, slug)')
      .eq('user_id', userId)
      .maybeSingle();

    if (companyUser?.companies) {
      setCompanyInfo(companyUser.companies);
      const { data: jobsData } = await supabase
        .from('jobs')
        .select('*')
        .eq('company_id', (companyUser.companies as any).id)
        .order('created_at', { ascending: false });
      setJobs((jobsData as Job[]) || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { navigate('/login'); return; }
      setUser(user);
      fetchData(user.id);
    });
  }, [navigate, fetchData]);

  const handleSubmit = async (e: React.FormEvent, publish: boolean) => {
    e.preventDefault();
    if (!user || !companyInfo) return;
    setFormLoading(true);
    setFormError('');

    const { error } = await supabase.from('jobs').insert({
      company_id: companyInfo.id,
      company: companyInfo.name,
      posted_by: user.id,
      title, description, location, salary,
      type: jobType, category, visibility,
      is_published: publish,
    });

    if (error) {
      setFormError(error.message);
    } else {
      setTitle(''); setDescription(''); setLocation(''); setSalary('');
      setJobType('Full-time'); setCategory('Engineering');
      fetchData(user.id);
    }
    setFormLoading(false);
  };

  const handleTogglePublish = async (job: Job) => {
    await supabase.from('jobs').update({ is_published: !job.is_published }).eq('id', job.id);
    if (user) fetchData(user.id);
  };

  const handleDelete = async (jobId: string) => {
    if (!confirm('Delete this job posting?')) return;
    await supabase.from('jobs').delete().eq('id', jobId);
    if (user) fetchData(user.id);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;

  return (
    <div className="min-h-screen bg-secondary/50">
      <nav className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground">HR Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">{companyInfo?.name || 'No company linked'}</p>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Post Form */}
        <div className="lg:col-span-1">
          <div className="bg-card rounded-xl shadow-sm border border-border p-6 sticky top-8">
            <h2 className="text-xl font-heading font-semibold text-foreground mb-6">Post New Job</h2>
            <form onSubmit={(e) => handleSubmit(e, true)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Job Title</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} required
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm" placeholder="e.g. Senior Software Engineer" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Location</label>
                <input value={location} onChange={(e) => setLocation(e.target.value)} required
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm" placeholder="e.g. San Francisco, CA" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Salary Range</label>
                <input value={salary} onChange={(e) => setSalary(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm" placeholder="e.g. $120k - $180k" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Job Type</label>
                  <select value={jobType} onChange={(e) => setJobType(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm">
                    <option>Full-time</option><option>Part-time</option><option>Contract</option><option>Internship</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Category</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm">
                    <option>Engineering</option><option>Design</option><option>Marketing</option><option>Sales</option><option>Operations</option><option>HR</option><option>Finance</option><option>Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Visibility</label>
                <select value={visibility} onChange={(e) => setVisibility(e.target.value as any)}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm">
                  <option value="external">External (Public Career Page)</option>
                  <option value="internal">Internal Only</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows={5}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm resize-none" placeholder="Describe the role..." />
              </div>
              {formError && <div className="bg-destructive/10 text-destructive px-3 py-2 rounded-lg text-sm">{formError}</div>}
              <div className="flex gap-2">
                <button type="submit" disabled={formLoading}
                  className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50">
                  {formLoading ? 'Publishing...' : 'Publish Job'}
                </button>
                <button type="button" disabled={formLoading} onClick={(e) => handleSubmit(e, false)}
                  className="px-4 py-2.5 border border-border text-foreground rounded-lg text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50">
                  Draft
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Jobs List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card rounded-xl shadow-sm border border-border p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-heading font-semibold text-foreground">Your Job Postings</h2>
              <span className="text-sm text-muted-foreground">{jobs.length} total</span>
            </div>
            {jobs.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No job postings yet</h3>
                <p className="text-muted-foreground text-sm">Create your first job posting using the form.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {jobs.map((job) => (
                  <div key={job.id} className={`border rounded-lg p-5 transition-all ${job.is_published ? 'border-border bg-card' : 'border-border bg-muted/50 opacity-75'}`}>
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-lg font-semibold text-foreground">{job.title}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${job.is_published ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                            {job.is_published ? 'Published' : 'Draft'}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                            {job.visibility === 'external' ? 'External' : 'Internal'}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">{job.location} · {job.type}</p>
                        <p className="text-sm text-foreground/80 line-clamp-2">{job.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-3 border-t border-border">
                      <button onClick={() => handleTogglePublish(job)} className="px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted rounded-lg transition-colors">
                        {job.is_published ? 'Unpublish' : 'Publish'}
                      </button>
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

          {/* Career page link */}
          {companyInfo?.slug && (
            <div className="bg-foreground text-primary-foreground rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-heading font-semibold mb-2">Your Public Career Page</h3>
              <p className="text-sm opacity-80 mb-4">Share this link with candidates:</p>
              <div className="flex items-center gap-3">
                <code className="flex-1 bg-foreground/50 px-4 py-3 rounded-lg text-sm font-mono">
                  {`${window.location.origin}/careers/${companyInfo.slug}`}
                </code>
                <a href={`/careers/${companyInfo.slug}`} target="_blank" rel="noopener noreferrer"
                  className="px-4 py-3 bg-primary-foreground text-foreground rounded-lg font-medium hover:opacity-90 transition-opacity whitespace-nowrap text-sm">
                  View Page
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Briefcase(props: any) {
  return (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}
