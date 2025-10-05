import { JobCard } from '@/components/JobCard';
import { mockJobs } from '@/data/mockJobs';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

const SavedJobs = () => {
  const { isAuthenticated } = useAuth();
  const [savedJobIds, setSavedJobIds] = useState<string[]>([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('hireloom_saved_jobs') || '[]');
    setSavedJobIds(saved);
  }, []);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const savedJobs = mockJobs.filter((job) => savedJobIds.includes(job.id));

  return (
    <div className="min-h-screen gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Saved Jobs</h1>
          <p className="text-muted-foreground">Jobs you've bookmarked for later</p>
        </div>

        {savedJobs.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-xl text-muted-foreground mb-4">No saved jobs yet</p>
            <p className="text-muted-foreground">Browse jobs and bookmark the ones you're interested in</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedJobs;
