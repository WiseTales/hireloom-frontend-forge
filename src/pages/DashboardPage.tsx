import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { LogOut, Users, Briefcase as BriefcaseIcon, ExternalLink, Building2, LayoutDashboard, Star } from 'lucide-react';
import JobPostForm from '@/components/dashboard/JobPostForm';
import JobsList from '@/components/dashboard/JobsList';
import ApplicantsList from '@/components/dashboard/ApplicantsList';
import CandidatePipeline from '@/components/dashboard/CandidatePipeline';
import DashboardStats from '@/components/dashboard/DashboardStats';

type Tab = 'pipeline' | 'jobs' | 'scores';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [companyInfo, setCompanyInfo] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('pipeline');
  const [userRole, setUserRole] = useState<string>('');
  const navigate = useNavigate();

  // Company setup
  const [companyName, setCompanyName] = useState('');
  const [companySetupLoading, setCompanySetupLoading] = useState(false);
  const [companySetupError, setCompanySetupError] = useState('');

  const fetchData = useCallback(async (userId: string) => {
    const { data: companyUser } = await supabase
      .from('company_users')
      .select('company_id, role, companies(id, name, slug)')
      .eq('user_id', userId)
      .maybeSingle();

    if (companyUser?.companies) {
      const comp = companyUser.companies as any;
      setCompanyInfo(comp);
      setUserRole(companyUser.role);

      const { data: jobsData } = await (supabase.from('jobs') as any)
        .select('*')
        .eq('company_id', comp.id)
        .order('created_at', { ascending: false });
      const fetchedJobs = jobsData || [];
      setJobs(fetchedJobs);

      if (fetchedJobs.length > 0) {
        const jobIds = fetchedJobs.map((j: any) => j.id);
        const { data: appsData } = await supabase
          .from('public_applications')
          .select('*')
          .in('job_id', jobIds)
          .order('created_at', { ascending: false });
        setApplications(appsData || []);
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
    const { data: existing } = await supabase.from('companies').select('id, name, slug').eq('slug', slug).maybeSingle();

    if (existing) {
      const { error: linkErr } = await supabase
        .from('company_users')
        .insert({ company_id: existing.id, user_id: user.id, role: 'super_admin' });
      if (linkErr) { setCompanySetupError(linkErr.message); setCompanySetupLoading(false); return; }
      setCompanyInfo(existing);
      setCompanySetupLoading(false);
      fetchData(user.id);
      return;
    }

    const { data: newCompany, error: companyErr } = await supabase
      .from('companies')
      .insert({ name: companyName.trim(), slug, created_by: user.id })
      .select('id, name, slug')
      .single();

    if (companyErr || !newCompany) { setCompanySetupError(companyErr?.message || 'Failed'); setCompanySetupLoading(false); return; }

    const { error: linkErr } = await supabase
      .from('company_users')
      .insert({ company_id: newCompany.id, user_id: user.id, role: 'super_admin' });

    if (linkErr) { setCompanySetupError(linkErr.message); setCompanySetupLoading(false); return; }
    setCompanyInfo(newCompany);
    setCompanySetupLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;

  if (!companyInfo) {
    return (
      <div className="min-h-screen bg-secondary/50 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="bg-card rounded-2xl shadow-xl border border-border p-8">
            <div className="flex items-center justify-center w-14 h-14 bg-primary/10 rounded-xl mx-auto mb-6">
              <Building2 className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-2xl font-heading font-bold text-foreground text-center mb-2">Set Up Your Company</h1>
            <p className="text-sm text-muted-foreground text-center mb-8">Enter your company name to create your public careers page.</p>
            <form onSubmit={handleCompanySetup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Company Name</label>
                <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} required
                  className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm" placeholder="e.g. Blue Origin" />
              </div>
              {companyName.trim() && (
                <p className="text-xs text-muted-foreground">Career page: <span className="font-mono text-primary">/careers/{slugify(companyName.trim())}</span></p>
              )}
              {companySetupError && <div className="bg-destructive/10 text-destructive px-3 py-2 rounded-lg text-sm">{companySetupError}</div>}
              <button type="submit" disabled={companySetupLoading}
                className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 text-sm">
                {companySetupLoading ? 'Creating...' : 'Create Company & Continue'}
              </button>
            </form>
            <button onClick={handleLogout} className="w-full mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors">Sign out</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/50">
      <nav className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground">HR Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">{companyInfo.name}</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors">
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <JobPostForm user={user} companyInfo={companyInfo} onJobCreated={() => fetchData(user.id)} />
        </div>

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
              <Users className="w-4 h-4" /> Applicants <span className="text-xs opacity-70">({applications.length})</span>
            </button>
          </div>

          {activeTab === 'jobs' && <JobsList jobs={jobs} onRefresh={() => fetchData(user.id)} />}
          {activeTab === 'applicants' && <ApplicantsList jobs={jobs} applications={applications} onRefresh={() => fetchData(user.id)} />}
        </div>
      </div>
    </div>
  );
}
