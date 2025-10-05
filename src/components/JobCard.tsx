import { Job } from '@/types/job';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MapPin, Clock, Briefcase, Bookmark } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface JobCardProps {
  job: Job;
}

export const JobCard = ({ job }: JobCardProps) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isSaved, setIsSaved] = useState(false);
  const [isApplied, setIsApplied] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      const savedJobs = JSON.parse(localStorage.getItem('hireloom_saved_jobs') || '[]');
      const appliedJobs = JSON.parse(localStorage.getItem('hireloom_applied_jobs') || '[]');
      setIsSaved(savedJobs.includes(job.id));
      setIsApplied(appliedJobs.includes(job.id));
    }
  }, [isAuthenticated, job.id]);

  const handleApply = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/dashboard', jobId: job.id } });
      return;
    }

    const appliedJobs = JSON.parse(localStorage.getItem('hireloom_applied_jobs') || '[]');
    if (!appliedJobs.includes(job.id)) {
      appliedJobs.push(job.id);
      localStorage.setItem('hireloom_applied_jobs', JSON.stringify(appliedJobs));
      setIsApplied(true);
      toast.success('Application submitted successfully!');
    }
  };

  const handleSave = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/dashboard' } });
      return;
    }

    const savedJobs = JSON.parse(localStorage.getItem('hireloom_saved_jobs') || '[]');
    if (isSaved) {
      const updated = savedJobs.filter((id: string) => id !== job.id);
      localStorage.setItem('hireloom_saved_jobs', JSON.stringify(updated));
      setIsSaved(false);
      toast.success('Job removed from saved');
    } else {
      savedJobs.push(job.id);
      localStorage.setItem('hireloom_saved_jobs', JSON.stringify(savedJobs));
      setIsSaved(true);
      toast.success('Job saved successfully!');
    }
  };

  return (
    <Card className="p-6 hover:shadow-medium transition-smooth">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-semibold mb-1">{job.title}</h3>
          <p className="text-lg text-muted-foreground">{job.company}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleSave}
          className={isSaved ? 'text-primary' : ''}
        >
          <Bookmark className={`h-5 w-5 ${isSaved ? 'fill-current' : ''}`} />
        </Button>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>{job.location}</span>
          {job.isRemote && <span className="px-2 py-0.5 bg-accent text-accent-foreground rounded text-xs">Remote</span>}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Briefcase className="h-4 w-4" />
          <span>{job.type}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>{job.posted}</span>
        </div>
      </div>

      {job.salary && (
        <p className="text-sm font-medium text-primary mb-4">{job.salary}</p>
      )}

      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{job.description}</p>

      <div className="flex gap-2">
        <Button 
          className="flex-1" 
          onClick={handleApply}
          disabled={isApplied}
        >
          {isApplied ? 'Applied' : 'Apply Now'}
        </Button>
        <Button variant="outline">View Details</Button>
      </div>
    </Card>
  );
};
