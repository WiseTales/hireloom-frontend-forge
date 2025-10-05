import { JobCard } from '@/components/JobCard';
import { mockJobs } from '@/data/mockJobs';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

const AppliedJobs = () => {
  const { isAuthenticated } = useAuth();
  const [appliedJobIds, setAppliedJobIds] = useState<string[]>([]);

  useEffect(() => {
    const applied = JSON.parse(localStorage.getItem('hireloom_applied_jobs') || '[]');
    setAppliedJobIds(applied);
  }, []);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const appliedJobs = mockJobs.filter((job) => appliedJobIds.includes(job.id));

  return (
    <div className="min-h-screen gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Applied Jobs</h1>
          <p className="text-muted-foreground">Track your job applications</p>
        </div>

        {appliedJobs.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {appliedJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-xl text-muted-foreground mb-4">No applications yet</p>
            <p className="text-muted-foreground">Start applying to jobs that match your skills</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppliedJobs;
