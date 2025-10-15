import { useState, useEffect } from 'react';
import { JobCard } from '@/components/JobCard';
import { JobCategory } from '@/types/job';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const JobSeekerDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [appliedJobs, setAppliedJobs] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchJobs();
    fetchAppliedJobs();
  }, [user]);

  const fetchJobs = async () => {
    setLoadingJobs(true);
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      setJobs(data);
    }
    setLoadingJobs(false);
  };

  const fetchAppliedJobs = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('job_applications')
      .select('job_id')
      .eq('user_id', user.id);

    if (data) {
      setAppliedJobs(new Set(data.map(app => app.job_id)));
    }
  };

  const handleApply = async (jobId: string) => {
    if (!user) return;

    // Get user profile for name and email
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .single();

    const { error } = await supabase
      .from('job_applications')
      .insert([{
        job_id: jobId,
        user_id: user.id,
        applicant_email: profile?.email || user.email || '',
        applicant_name: profile?.full_name || 'Applicant'
      }]);

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        toast({
          title: 'Already Applied',
          description: 'You have already applied to this job',
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to apply to job',
          variant: 'destructive'
        });
      }
    } else {
      toast({
        title: 'Success',
        description: 'Successfully applied to job!'
      });
      fetchAppliedJobs();
    }
  };

  const categories: JobCategory[] = ['IT/Tech', 'Sales/Marketing', 'Finance', 'Healthcare', 'Engineering', 'Design'];

  if (loadingJobs) {
    return (
      <div className="min-h-screen gradient-subtle flex items-center justify-center">
        <p className="text-lg text-muted-foreground">Loading jobs...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Explore Opportunities</h1>
          <p className="text-muted-foreground">Discover jobs that match your skills and interests</p>
        </div>

        {jobs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">No jobs available at the moment.</p>
            <p className="text-sm text-muted-foreground mt-2">Check back later for new opportunities!</p>
          </div>
        ) : (
          categories.map((category) => {
            const categoryJobs = jobs.filter((job) => job.category === category);
            
            if (categoryJobs.length === 0) return null;

            return (
              <section key={category} className="mb-12">
                <h2 className="text-2xl font-semibold mb-6">Jobs in {category}</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {categoryJobs.map((job) => (
                    <div key={job.id} className="space-y-3">
                      <JobCard 
                        job={{
                          id: job.id,
                          title: job.title,
                          company: job.company,
                          location: job.location,
                          type: job.type,
                          category: job.category,
                          salary: job.salary || '',
                          description: job.description,
                          requirements: [],
                          posted: new Date(job.created_at).toLocaleDateString(),
                          isRemote: job.location.toLowerCase().includes('remote')
                        }} 
                      />
                      <Button 
                        className="w-full" 
                        onClick={() => handleApply(job.id)}
                        disabled={appliedJobs.has(job.id)}
                      >
                        {appliedJobs.has(job.id) ? 'Applied' : 'Apply Now'}
                      </Button>
                    </div>
                  ))}
                </div>
              </section>
            );
          })
        )}
      </div>
    </div>
  );
};

export default JobSeekerDashboard;
