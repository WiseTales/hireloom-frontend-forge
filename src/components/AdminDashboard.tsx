import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';

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
    totalJobs: 0,
    totalJobSeekers: 0
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
          totalJobSeekers: jobSeekers?.length || 0
        });
      }
    } catch (error) {
      console.error('Error in fetchAdminData:', error);
    }

    setLoading(false);
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
        <div className="grid md:grid-cols-3 gap-6 mb-8">
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
                            <Card key={job.id} className="border-l-4 border-l-primary">
                              <CardHeader className="pb-3">
                                <CardTitle className="text-lg">{job.title}</CardTitle>
                                <CardDescription>
                                  {job.company} • {job.location}
                                </CardDescription>
                              </CardHeader>
                              <CardContent>
                                <div className="flex flex-wrap gap-2 mb-2">
                                  <Badge variant="outline">{job.type}</Badge>
                                  <Badge variant="outline">{job.category}</Badge>
                                  {job.salary && <Badge variant="outline">{job.salary}</Badge>}
                                </div>
                                <p className="text-xs text-muted-foreground">
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
      </div>
    </div>
  );
};

export default AdminDashboard;
