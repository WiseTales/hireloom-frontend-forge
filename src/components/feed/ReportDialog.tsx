import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Flag } from 'lucide-react';
import { toast } from 'sonner';

interface ReportDialogProps {
  contentType: 'post' | 'comment' | 'user';
  contentId: string;
  trigger?: React.ReactNode;
}

const REPORT_REASONS = [
  { value: 'spam', label: 'Spam or misleading' },
  { value: 'harassment', label: 'Harassment or hate speech' },
  { value: 'inappropriate', label: 'Inappropriate content' },
  { value: 'violence', label: 'Violence or dangerous organizations' },
  { value: 'false_info', label: 'False information' },
  { value: 'other', label: 'Other' },
];

export const ReportDialog = ({ contentType, contentId, trigger }: ReportDialogProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('spam');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user) {
      toast.error('You must be logged in to report content');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('reports').insert({
        reporter_id: user.id,
        reported_content_type: contentType,
        reported_content_id: contentId,
        reason,
        description,
      });

      if (error) throw error;

      toast.success('Report submitted successfully');
      setOpen(false);
      setReason('spam');
      setDescription('');
    } catch (error) {
      console.error('Error submitting report:', error);
      toast.error('Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm">
            <Flag className="h-4 w-4 mr-2" />
            Report
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report {contentType}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Reason for reporting</Label>
            <RadioGroup value={reason} onValueChange={setReason} className="mt-2">
              {REPORT_REASONS.map((r) => (
                <div key={r.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={r.value} id={r.value} />
                  <Label htmlFor={r.value} className="font-normal cursor-pointer">
                    {r.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          <div>
            <Label htmlFor="description">Additional details (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide more context about this report..."
              rows={4}
              className="mt-2"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Report'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
