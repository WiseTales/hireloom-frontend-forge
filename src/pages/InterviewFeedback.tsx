import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { ArrowLeft, Star } from 'lucide-react';

interface Interview {
  id: string;
  scheduled_at: string;
  interview_type: string;
  applicant: {
    id: string;
    name: string;
    email: string;
  } | null;
  job: {
    id: string;
    title: string;
    company: string;
  } | null;
}

const InterviewFeedback = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [interview, setInterview] = useState<Interview | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({
    overallRating: 0,
    technicalRating: 0,
    communicationRating: 0,
    cultureFitRating: 0,
    strengths: '',
    weaknesses: '',
    recommendation: '',
    notes: ''
  });

  useEffect(() => {
    if (id) {
      fetchInterview();
    }
  }, [id]);

  const fetchInterview = async () => {
    try {
      const { data, error } = await supabase
        .from('interviews')
        .select(`
          *,
          applicant:applicants(id, name, email),
          job:jobs(id, title, company)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setInterview(data);

      // Check if feedback already exists
      if (user) {
        const { data: existingFeedback } = await supabase
          .from('interview_feedback')
          .select('*')
          .eq('interview_id', id)
          .eq('interviewer_id', user.id)
          .maybeSingle();

        if (existingFeedback) {
          setFeedback({
            overallRating: existingFeedback.overall_rating || 0,
            technicalRating: existingFeedback.technical_rating || 0,
            communicationRating: existingFeedback.communication_rating || 0,
            cultureFitRating: existingFeedback.culture_fit_rating || 0,
            strengths: existingFeedback.strengths || '',
            weaknesses: existingFeedback.weaknesses || '',
            recommendation: existingFeedback.recommendation || '',
            notes: existingFeedback.notes || ''
          });
        }
      }
    } catch (error) {
      console.error('Error fetching interview:', error);
      toast.error('Failed to load interview details');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user || !interview) return;

    if (!feedback.recommendation) {
      toast.error('Please select a recommendation');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('interview_feedback')
        .upsert({
          interview_id: interview.id,
          interviewer_id: user.id,
          overall_rating: feedback.overallRating || null,
          technical_rating: feedback.technicalRating || null,
          communication_rating: feedback.communicationRating || null,
          culture_fit_rating: feedback.cultureFitRating || null,
          strengths: feedback.strengths || null,
          weaknesses: feedback.weaknesses || null,
          recommendation: feedback.recommendation,
          notes: feedback.notes || null
        }, {
          onConflict: 'interview_id,interviewer_id'
        });

      if (error) throw error;
      toast.success('Feedback submitted successfully!');
      navigate('/interviews');
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  const RatingInput = ({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) => (
    <div>
      <Label className="mb-2 block">{label}</Label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            type="button"
            onClick={() => onChange(rating)}
            className={`p-2 rounded hover:bg-muted ${value >= rating ? 'text-yellow-500' : 'text-muted-foreground'}`}
          >
            <Star className={`h-6 w-6 ${value >= rating ? 'fill-current' : ''}`} />
          </button>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="container mx-auto p-6 text-center">
        <p className="text-muted-foreground">Interview not found</p>
        <Button onClick={() => navigate('/interviews')} className="mt-4">
          Back to Interviews
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <button
        onClick={() => navigate('/interviews')}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Interviews
      </button>

      <Card>
        <CardHeader>
          <CardTitle>Interview Feedback</CardTitle>
          <div className="text-muted-foreground">
            <p className="font-medium text-foreground">{interview.applicant?.name}</p>
            <p>{interview.job?.title} at {interview.job?.company}</p>
            <p className="text-sm capitalize">{interview.interview_type} Interview</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Ratings */}
          <div className="grid md:grid-cols-2 gap-6">
            <RatingInput
              label="Overall Rating"
              value={feedback.overallRating}
              onChange={(v) => setFeedback(prev => ({ ...prev, overallRating: v }))}
            />
            <RatingInput
              label="Technical Skills"
              value={feedback.technicalRating}
              onChange={(v) => setFeedback(prev => ({ ...prev, technicalRating: v }))}
            />
            <RatingInput
              label="Communication"
              value={feedback.communicationRating}
              onChange={(v) => setFeedback(prev => ({ ...prev, communicationRating: v }))}
            />
            <RatingInput
              label="Culture Fit"
              value={feedback.cultureFitRating}
              onChange={(v) => setFeedback(prev => ({ ...prev, cultureFitRating: v }))}
            />
          </div>

          {/* Strengths */}
          <div>
            <Label htmlFor="strengths">Strengths</Label>
            <Textarea
              id="strengths"
              placeholder="What were the candidate's key strengths?"
              value={feedback.strengths}
              onChange={(e) => setFeedback(prev => ({ ...prev, strengths: e.target.value }))}
              className="mt-2"
            />
          </div>

          {/* Weaknesses */}
          <div>
            <Label htmlFor="weaknesses">Areas for Improvement</Label>
            <Textarea
              id="weaknesses"
              placeholder="What areas could the candidate improve?"
              value={feedback.weaknesses}
              onChange={(e) => setFeedback(prev => ({ ...prev, weaknesses: e.target.value }))}
              className="mt-2"
            />
          </div>

          {/* Recommendation */}
          <div>
            <Label className="mb-3 block">Recommendation *</Label>
            <RadioGroup
              value={feedback.recommendation}
              onValueChange={(v) => setFeedback(prev => ({ ...prev, recommendation: v }))}
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                  <RadioGroupItem value="strong_hire" id="strong_hire" />
                  <Label htmlFor="strong_hire" className="cursor-pointer">Strong Hire</Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                  <RadioGroupItem value="hire" id="hire" />
                  <Label htmlFor="hire" className="cursor-pointer">Hire</Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                  <RadioGroupItem value="no_hire" id="no_hire" />
                  <Label htmlFor="no_hire" className="cursor-pointer">No Hire</Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                  <RadioGroupItem value="strong_no_hire" id="strong_no_hire" />
                  <Label htmlFor="strong_no_hire" className="cursor-pointer">Strong No Hire</Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Additional Notes */}
          <div>
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any other observations or comments..."
              value={feedback.notes}
              onChange={(e) => setFeedback(prev => ({ ...prev, notes: e.target.value }))}
              className="mt-2"
              rows={4}
            />
          </div>

          <Button onClick={handleSubmit} disabled={submitting} className="w-full">
            {submitting ? 'Submitting...' : 'Submit Feedback'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default InterviewFeedback;