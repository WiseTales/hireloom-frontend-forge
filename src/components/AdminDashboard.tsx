import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Users, Eye, EyeOff } from 'lucide-react';
import ApplicationsViewer from './ApplicationsViewer';

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
  const [viewingApplicationsFor, setViewingApplicationsFor] = useState<{ id: string; title: string } | null>(null);
  const [stats, setStats] = useState({
    totalRecruiters: 0,
    totalJobs: 0,
    totalJobSeekers: 0,
    totalApplications: 0
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

      // Fetch stats
      const { data: jobSeekers } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'job_seeker');

      // Fetch total applications count
      const { count: applicationsCount } = await supabase
        .from('public_applications')
        .select('*', { count: 'exact', head: true });

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
          totalJobs: allJobs.length,
          totalJobSeekers: jobSeekers?.length || 0,
          totalApplications: applicationsCount || 0
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

        {/* Stats Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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

          <Card>
            <CardHeader>
              <CardTitle>Job Seekers</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-primary">{stats.totalJobSeekers}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Total Applications</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-primary">{stats.totalApplications}</p>
            </CardContent>
          </Card>
        </div>

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
                                <p className="text-xs text-muted-foreground">
                                  Posted: {new Date(job.created_at).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}
                                </p>
                                <div className="mt-4">
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    className="gap-1"
                                    onClick={() => setViewingApplicationsFor({ id: job.id, title: job.title })}
                                  >
                                    <Users className="h-4 w-4" />
                                    View Applications
                                  </Button>
                                </div>

                                {viewingApplicationsFor?.id === job.id && (
                                  <div className="mt-4 pt-4 border-t">
                                    <ApplicationsViewer 
                                      jobId={job.id} 
                                      jobTitle={job.title} 
                                    />
                                  </div>
                                )}
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
      </div>
    </div>
  );
};

export default AdminDashboard;
