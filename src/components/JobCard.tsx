import { Job } from '@/types/job';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MapPin, Clock, Briefcase, Bookmark } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { createNotification } from '@/hooks/useNotifications';

interface JobCardProps {
  job: Job;
}

export const JobCard = ({ job }: JobCardProps) => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [isSaved, setIsSaved] = useState(false);
  const [isApplied, setIsApplied] = useState(false);

  useEffect(() => {
    if (user) {
      checkSavedStatus();
    }
  }, [user, job.id]);

  const checkSavedStatus = async () => {
    const { data: saved } = await supabase
      .from('saved_jobs')
      .select('id')
      .eq('user_id', user?.id)
      .eq('job_id', job.id)
      .single();

    setIsSaved(!!saved);
  };

  const handleApply = () => {
    navigate(`/jobs/${job.id}`);
  };

  const handleSave = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (isSaved) {
      await supabase
        .from('saved_jobs')
        .delete()
        .eq('user_id', user.id)
        .eq('job_id', job.id);
      setIsSaved(false);
      toast.success('Job removed from saved');
    } else {
      await supabase
        .from('saved_jobs')
        .insert({ user_id: user.id, job_id: job.id });

      await createNotification({
        userId: user.id,
        type: 'job_saved',
        title: 'Job Saved',
        message: `You saved ${job.title} at ${job.company}`,
        link: '/saved',
      });

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
