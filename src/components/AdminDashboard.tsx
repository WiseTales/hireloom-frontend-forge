import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Eye, EyeOff, ExternalLink, Users, Settings, Briefcase, BarChart3, ShieldCheck, UserPlus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ApplicantsList } from '@/components/recruiter/ApplicantsList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Recruiter {
  id: string;
  full_name: string;
  email: string;
}

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  category: string;
  salary: string;
  application_url: string | null;
  created_at: string;
  is_published: boolean | null;
  visibility: string | null;
}

interface RecruiterWithJobs {
  recruiter: Recruiter;
  jobs: Job[];
}

const AdminDashboard = () => {
  const [recruitersData, setRecruitersData] = useState<RecruiterWithJobs[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRecruiters: 0,
    totalJobs: 0
  });

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);

    try {
      // Fetch all recruiters with their profiles
      const { data: recruiterRoles, error: recruitersError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'recruiter');

      if (recruitersError) {
        console.error('Error fetching recruiters:', recruitersError);
      }

      // Fetch all jobs
      const { data: allJobs, error: jobsError } = await supabase
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false });

      if (jobsError) {
        console.error('Error fetching jobs:', jobsError);
      }

      if (recruiterRoles && allJobs) {
        // Fetch profiles for all recruiters
        const recruiterIds = recruiterRoles.map(r => r.user_id);
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', recruiterIds);

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
        }

        // Group jobs by recruiter
        const recruitersWithJobs: RecruiterWithJobs[] = (profiles || []).map((profile) => {
          const recruiterJobs = allJobs.filter(job => job.posted_by === profile.id);

          return {
            recruiter: {
              id: profile.id,
              full_name: profile.full_name || profile.email,
              email: profile.email
            },
            jobs: recruiterJobs
          };
        });

        setRecruitersData(recruitersWithJobs);
        setStats({
          totalRecruiters: recruitersWithJobs.length,
          totalJobs: allJobs.length
        });
      }
    } catch (error) {
      console.error('Error in fetchAdminData:', error);
    }

    setLoading(false);
  };

  const togglePublishJob = async (jobId: string, currentStatus: boolean | null) => {
    const { error } = await supabase
      .from('jobs')
      .update({ is_published: !currentStatus })
      .eq('id', jobId);

    if (!error) {
      fetchAdminData();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-subtle flex items-center justify-center">
        <p className="text-lg text-muted-foreground">Loading admin dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-8">Admin Dashboard</h1>

        <Tabs defaultValue="stats" className="space-y-6">
          <TabsList>
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="recruiters" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Jobs
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              User Management
            </TabsTrigger>
            <TabsTrigger value="branding" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Company Branding
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stats">
            {/* Stats Cards */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle>Total Recruiters</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold text-primary">{stats.totalRecruiters}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Total Jobs Posted</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold text-primary">{stats.totalJobs}</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="recruiters">
            {/* Recruiters and Their Jobs */}
            <Card>
              <CardHeader>
                <CardTitle>Recruiters & Their Job Postings</CardTitle>
                <CardDescription>View all recruiters and the jobs they have posted</CardDescription>
              </CardHeader>
              <CardContent>
                {recruitersData.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">
                    No recruiters have registered yet.
                  </p>
                ) : (
                  <Accordion type="single" collapsible className="w-full">
                    {recruitersData.map((data, index) => (
                      <AccordionItem key={data.recruiter.id} value={`recruiter-${index}`}>
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center justify-between w-full pr-4">
                            <div className="text-left">
                              <p className="font-semibold">{data.recruiter.full_name}</p>
                              <p className="text-sm text-muted-foreground">{data.recruiter.email}</p>
                            </div>
                            <Badge variant="secondary">
                              {data.jobs.length} {data.jobs.length === 1 ? 'job' : 'jobs'}
                            </Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          {data.jobs.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-4">
                              This recruiter hasn't posted any jobs yet.
                            </p>
                          ) : (
                            <div className="space-y-4 pt-4">
                              {data.jobs.map((job) => (
                                <Card key={job.id} className={`border-l-4 ${job.is_published ? 'border-l-green-500' : 'border-l-muted'}`}>
                                  <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                      <div>
                                        <CardTitle className="text-lg">{job.title}</CardTitle>
                                        <CardDescription>
                                          {job.company} • {job.location}
                                        </CardDescription>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        {job.is_published ? (
                                          <Badge className="bg-green-100 text-green-700">
                                            <Eye className="h-3 w-3 mr-1" />
                                            Published
                                          </Badge>
                                        ) : (
                                          <Badge variant="secondary">
                                            <EyeOff className="h-3 w-3 mr-1" />
                                            Draft
                                          </Badge>
                                        )}
                                        <Switch
                                          checked={job.is_published || false}
                                          onCheckedChange={() => togglePublishJob(job.id, job.is_published)}
                                        />
                                      </div>
                                    </div>
                                  </CardHeader>
                                  <CardContent>
                                    <div className="flex flex-wrap gap-2 mb-2">
                                      <Badge variant="outline">{job.type}</Badge>
                                      <Badge variant="outline">{job.category}</Badge>
                                      {job.salary && <Badge variant="outline">{job.salary}</Badge>}
                                      {job.visibility && <Badge variant="outline" className="capitalize">{job.visibility}</Badge>}
                                    </div>

                                    {job.application_url && (
                                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                                        <ExternalLink className="h-4 w-4" />
                                        <a
                                          href={job.application_url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="hover:underline truncate max-w-md"
                                        >
                                          {job.application_url}
                                        </a>
                                      </div>
                                    )}

                                    <p className="text-xs text-muted-foreground mt-2">
                                      Posted: {new Date(job.created_at).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                      })}
                                    </p>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Manage Team Accounts</CardTitle>
                <CardDescription>Create and manage HR and hiring manager accounts for your organization.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-4 border rounded-lg bg-slate-50">
                  <div>
                    <p className="font-bold">Total Active Users</p>
                    <p className="text-sm text-muted-foreground">{recruitersData.length + 1} users in your company</p>
                  </div>
                  <Button className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    Invite Member
                  </Button>
                </div>
                <div className="space-y-2">
                  {/* Mock user list */}
                  {recruitersData.map((data) => (
                    <div key={data.recruiter.id} className="flex items-center justify-between p-3 border rounded-lg bg-white">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                          {data.recruiter.full_name[0]}
                        </div>
                        <div>
                          <p className="text-sm font-bold">{data.recruiter.full_name}</p>
                          <p className="text-xs text-muted-foreground">{data.recruiter.email}</p>
                        </div>
                      </div>
                      <Badge variant="outline">Recruiter</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="branding">
            <Card>
              <CardHeader>
                <CardTitle>Company Branding</CardTitle>
                <CardDescription>Customize how Hireloom looks for your candidates and team.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label>Company Name</Label>
                    <Input defaultValue="Hireloom Corp" />
                  </div>
                  <div className="space-y-2">
                    <Label>Primary Color</Label>
                    <div className="flex gap-2">
                      <div className="h-8 w-8 rounded bg-[#1e293b] border" />
                      <Input defaultValue="#1e293b" className="font-mono" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Career Page Logo</Label>
                    <Button variant="outline" className="w-full border-dashed py-8">
                      Change Logo
                    </Button>
                  </div>
                </div>
                <Button className="w-full">Save Changes</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
