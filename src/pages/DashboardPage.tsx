import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { LogOut, Users, Briefcase as BriefcaseIcon, FileText, ExternalLink, ChevronDown, ChevronUp, Building2 } from 'lucide-react';

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

interface PublicApplication {
  id: string;
  job_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  resume_url: string;
  cover_letter: string | null;
  status: string | null;
  source: string | null;
  created_at: string | null;
}

type Tab = 'jobs' | 'applicants';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [companyInfo, setCompanyInfo] = useState<any>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<PublicApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('jobs');
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const navigate = useNavigate();

  // Company setup
  const [companyName, setCompanyName] = useState('');
  const [companySetupLoading, setCompanySetupLoading] = useState(false);
  const [companySetupError, setCompanySetupError] = useState('');

  // Job form
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
    const { data: companyUser } = await supabase
      .from('company_users')
      .select('company_id, companies(id, name, slug)')
      .eq('user_id', userId)
      .maybeSingle();

    if (companyUser?.companies) {
      const comp = companyUser.companies as any;
      setCompanyInfo(comp);

      const { data: jobsData } = await supabase
        .from('jobs')
        .select('*')
        .eq('company_id', comp.id)
        .order('created_at', { ascending: false });
      const fetchedJobs = (jobsData as Job[]) || [];
      setJobs(fetchedJobs);

      if (fetchedJobs.length > 0) {
        const jobIds = fetchedJobs.map(j => j.id);
        const { data: appsData } = await supabase
          .from('public_applications')
          .select('*')
          .in('job_id', jobIds)
          .order('created_at', { ascending: false });
        setApplications((appsData as PublicApplication[]) || []);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }: any) => {
      if (!u) { navigate('/login'); return; }
      setUser(u);
      fetchData(u.id);
    });
  }, [navigate, fetchData]);

  const slugify = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const handleCompanySetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !companyName.trim()) return;
    setCompanySetupLoading(true);
    setCompanySetupError('');

    const slug = slugify(companyName.trim());

    // Check if slug already taken
    const { data: existing } = await supabase.from('companies').select('id').eq('slug', slug).maybeSingle();
    if (existing) {
      setCompanySetupError(`A company with URL "${slug}" already exists. Try a different name.`);
      setCompanySetupLoading(false);
      return;
    }

    // Create company
    const { data: newCompany, error: companyErr } = await supabase
      .from('companies')
      .insert({ name: companyName.trim(), slug, created_by: user.id })
      .select('id, name, slug')
      .single();

    if (companyErr || !newCompany) {
      setCompanySetupError(companyErr?.message || 'Failed to create company');
      setCompanySetupLoading(false);
      return;
    }

    // Link user to company as super_admin
    const { error: linkErr } = await supabase
      .from('company_users')
      .insert({ company_id: newCompany.id, user_id: user.id, role: 'super_admin' });

    if (linkErr) {
      setCompanySetupError(linkErr.message);
      setCompanySetupLoading(false);
      return;
    }

    setCompanyInfo(newCompany);
    setCompanySetupLoading(false);
  };

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

  const getApplicationsForJob = (jobId: string) => applications.filter(a => a.job_id === jobId);
  const totalApplications = applications.length;

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;

  // Company setup screen
  if (!companyInfo) {
    return (
      <div className="min-h-screen bg-secondary/50 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="bg-card rounded-2xl shadow-xl border border-border p-8">
            <div className="flex items-center justify-center w-14 h-14 bg-primary/10 rounded-xl mx-auto mb-6">
              <Building2 className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-2xl font-heading font-bold text-foreground text-center mb-2">Set Up Your Company</h1>
            <p className="text-sm text-muted-foreground text-center mb-8">
              Enter your company name. This will create your public careers page.
            </p>
            <form onSubmit={handleCompanySetup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Company Name</label>
                <input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm"
                  placeholder="e.g. Nexacore, Microsoft, Acme Inc"
                />
              </div>
              {companyName.trim() && (
                <p className="text-xs text-muted-foreground">
                  Your career page URL: <span className="font-mono text-primary">/careers/{slugify(companyName.trim())}</span>
                </p>
              )}
              {companySetupError && (
                <div className="bg-destructive/10 text-destructive px-3 py-2 rounded-lg text-sm">{companySetupError}</div>
              )}
              <button
                type="submit"
                disabled={companySetupLoading}
                className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 text-sm"
              >
                {companySetupLoading ? 'Creating...' : 'Create Company & Continue'}
              </button>
            </form>
            <button onClick={handleLogout} className="w-full mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors">
              Sign out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/50">
      {/* Nav */}
      <nav className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground">HR Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">{companyInfo.name}</p>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Post Form */}
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

        {/* Right: Tabs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Career page link */}
          <div className="bg-foreground text-primary-foreground rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-heading font-semibold mb-2">Your Public Career Page</h3>
            <p className="text-sm opacity-80 mb-4">Share this link with candidates:</p>
            <div className="flex items-center gap-3">
              <code className="flex-1 bg-foreground/50 px-4 py-3 rounded-lg text-sm font-mono overflow-x-auto">
                {`${window.location.origin}/careers/${companyInfo.slug}`}
              </code>
              <a href={`/careers/${companyInfo.slug}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-3 bg-primary-foreground text-foreground rounded-lg font-medium hover:opacity-90 transition-opacity whitespace-nowrap text-sm">
                <ExternalLink className="w-4 h-4" /> View
              </a>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="flex gap-1 bg-muted p-1 rounded-lg w-fit">
            <button onClick={() => setActiveTab('jobs')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'jobs' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
              <BriefcaseIcon className="w-4 h-4" /> Jobs <span className="text-xs opacity-70">({jobs.length})</span>
            </button>
            <button onClick={() => setActiveTab('applicants')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'applicants' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
              <Users className="w-4 h-4" /> Applicants <span className="text-xs opacity-70">({totalApplications})</span>
            </button>
          </div>

          {/* Jobs Tab */}
          {activeTab === 'jobs' && (
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
                  {jobs.map((job) => {
                    const jobApps = getApplicationsForJob(job.id);
                    return (
                      <div key={job.id} className={`border rounded-lg p-5 transition-all ${job.is_published ? 'border-border bg-card' : 'border-border bg-muted/50 opacity-75'}`}>
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1 flex-wrap">
                              <h3 className="text-lg font-semibold text-foreground">{job.title}</h3>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${job.is_published ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                {job.is_published ? 'Published' : 'Draft'}
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                                {job.visibility === 'external' ? 'External' : 'Internal'}
                              </span>
                              {jobApps.length > 0 && (
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-accent text-accent-foreground">
                                  {jobApps.length} applicant{jobApps.length !== 1 ? 's' : ''}
                                </span>
                              )}
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
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Applicants Tab */}
          {activeTab === 'applicants' && (
            <div className="bg-card rounded-xl shadow-sm border border-border p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-heading font-semibold text-foreground">Applications</h2>
                <span className="text-sm text-muted-foreground">{totalApplications} total</span>
              </div>
              {totalApplications === 0 ? (
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
                            {jobApps.map((app) => (
                              <div key={app.id} className="px-5 py-4 border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h4 className="text-sm font-semibold text-foreground">{app.full_name}</h4>
                                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                        app.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                        app.status === 'reviewed' ? 'bg-blue-100 text-blue-800' :
                                        app.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                        app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                        'bg-muted text-muted-foreground'
                                      }`}>
                                        {app.status || 'pending'}
                                      </span>
                                      {app.source && (
                                        <span className="text-xs text-muted-foreground">via {app.source}</span>
                                      )}
                                    </div>
                                    <p className="text-xs text-muted-foreground">{app.email}{app.phone ? ` · ${app.phone}` : ''}</p>
                                    {app.cover_letter && (
                                      <p className="text-xs text-foreground/70 mt-2 line-clamp-2">{app.cover_letter}</p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    {app.resume_url && app.resume_url !== 'not_provided' && (
                                      <a href={app.resume_url} target="_blank" rel="noopener noreferrer"
                                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors">
                                        <FileText className="w-3.5 h-3.5" /> Resume
                                      </a>
                                    )}
                                    <span className="text-xs text-muted-foreground">
                                      {app.created_at ? new Date(app.created_at).toLocaleDateString() : ''}
                                    </span>
                                  </div>
                                </div>
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
          )}
        </div>
      </div>
    </div>
  );
}
