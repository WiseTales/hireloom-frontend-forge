import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, CheckCircle2, User, Mail, FileText } from 'lucide-react';
import { createNotification } from '@/hooks/useNotifications';

interface JobApplyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: {
    id: string;
    title: string;
    company: string;
  };
  onSuccess?: () => void;
}

export const JobApplyModal = ({ open, onOpenChange, job, onSuccess }: JobApplyModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [profile, setProfile] = useState<{ full_name: string | null; email: string; headline: string | null } | null>(null);
  const [hasApplied, setHasApplied] = useState(false);

  useEffect(() => {
    if (open && user) {
      fetchProfile();
      checkExistingApplication();
    }
  }, [open, user, job.id]);

  const fetchProfile = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('profiles')
      .select('full_name, email, headline')
      .eq('id', user.id)
      .single();
    
    if (data) {
      setProfile(data);
    }
  };

  const checkExistingApplication = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('job_applications')
      .select('id')
      .eq('job_id', job.id)
      .eq('user_id', user.id)
      .single();
    
    setHasApplied(!!data);
  };

  const handleSubmit = async () => {
    if (!user || !profile) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('job_applications')
        .insert({
          job_id: job.id,
          user_id: user.id,
          applicant_name: profile.full_name || 'Applicant',
          applicant_email: profile.email,
          status: 'applied'
        });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: 'Already Applied',
            description: 'You have already applied to this job',
            variant: 'destructive'
          });
          setHasApplied(true);
          return;
        }
        throw error;
      }

      // Create notification
      await createNotification({
        userId: user.id,
        type: 'job_application',
        title: 'Application Submitted',
        message: `Your application for ${job.title} at ${job.company} has been submitted successfully.`,
        link: '/applied',
      });

      toast({
        title: 'Application Submitted! 🎉',
        description: `Your application for ${job.title} has been sent to ${job.company}.`
      });

      setHasApplied(true);
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Application error:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit application. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (hasApplied) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-green-100 p-3 mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <DialogTitle className="text-xl mb-2">Already Applied</DialogTitle>
            <DialogDescription>
              You have already submitted your application for this position at {job.company}.
            </DialogDescription>
            <Button className="mt-6" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Apply for {job.title}</DialogTitle>
          <DialogDescription>
            Submit your application to {job.company}. Your profile information will be shared with the employer.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Profile Preview */}
          <div className="p-4 bg-muted/50 rounded-lg space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground">Your Profile</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{profile?.full_name || 'Name not set'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{profile?.email}</span>
              </div>
              {profile?.headline && (
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{profile.headline}</span>
                </div>
              )}
            </div>
          </div>

          {/* Cover Letter */}
          <div className="space-y-2">
            <Label htmlFor="coverLetter">Cover Letter (Optional)</Label>
            <Textarea
              id="coverLetter"
              placeholder="Tell the employer why you're a great fit for this role..."
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              rows={5}
            />
            <p className="text-xs text-muted-foreground">
              A personalized cover letter can help your application stand out.
            </p>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !profile}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Application'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
