import { useState, useEffect } from 'react';
import { JobCard } from '@/components/JobCard';
import { JobCategory } from '@/types/job';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import RecruiterDashboard from '@/components/RecruiterDashboard';
import AdminDashboard from '@/components/AdminDashboard';
import { supabase } from '@/integrations/supabase/client';

const Dashboard = () => {
  const { isAuthenticated, userRole, loading } = useAuth();

  if (!isAuthenticated && !loading) {
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen gradient-subtle flex items-center justify-center">
        <p className="text-lg text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // Role-based dashboard rendering
  if (userRole === 'recruiter') {
    return <RecruiterDashboard />;
  }

  if (userRole === 'admin') {
    return <AdminDashboard />;
  }

  // Default: Job Seeker Dashboard
  const [jobs, setJobs] = useState<any[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, []);

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
                    <JobCard 
                      key={job.id} 
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

export default Dashboard;
