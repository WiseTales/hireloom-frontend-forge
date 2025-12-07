import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';

interface Interview {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  interview_type: string;
  status: string;
  meeting_link: string | null;
  location: string | null;
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

interface Feedback {
  id: string;
  interview_id: string;
  submitted_at: string;
  interview: Interview | null;
}

const Interviews = () => {
  const { user, userRole } = useAuth();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [pendingFeedback, setPendingFeedback] = useState<Interview[]>([]);
  const [completedFeedback, setCompletedFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, userRole]);

  const fetchData = async () => {
    if (!user) return;
    
    try {
      // Fetch all interviews
      let query = supabase
        .from('interviews')
        .select(`
          *,
          applicant:applicants(id, name, email),
          job:jobs(id, title, company)
        `)
        .order('scheduled_at', { ascending: false });

      if (userRole === 'interviewer') {
        query = query.eq('interviewer_id', user.id);
      }

      const { data: interviewsData, error: interviewsError } = await query;
      if (interviewsError) throw interviewsError;
      setInterviews(interviewsData || []);

      // Fetch completed interviews needing feedback
      const { data: completed, error: completedError } = await supabase
        .from('interviews')
        .select(`
          *,
          applicant:applicants(id, name, email),
          job:jobs(id, title, company)
        `)
        .eq('interviewer_id', user.id)
        .eq('status', 'completed')
        .order('scheduled_at', { ascending: false });

      if (completedError) throw completedError;

      // Check which ones have feedback
      const { data: feedbacks, error: feedbackError } = await supabase
        .from('interview_feedback')
        .select('interview_id')
        .eq('interviewer_id', user.id);

      if (feedbackError) throw feedbackError;

      const feedbackInterviewIds = new Set(feedbacks?.map(f => f.interview_id) || []);
      const pending = completed?.filter(i => !feedbackInterviewIds.has(i.id)) || [];
      setPendingFeedback(pending);

      // Fetch completed feedback
      const { data: allFeedback, error: allFeedbackError } = await supabase
        .from('interview_feedback')
        .select(`
          *,
          interview:interviews(
            *,
            applicant:applicants(id, name, email),
            job:jobs(id, title, company)
          )
        `)
        .eq('interviewer_id', user.id)
        .order('submitted_at', { ascending: false });

      if (allFeedbackError) throw allFeedbackError;
      setCompletedFeedback(allFeedback || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const upcomingInterviews = interviews.filter(
    i => new Date(i.scheduled_at) >= new Date() && i.status === 'scheduled'
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">Interviews</h1>

        {/* Feedback to complete */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4">Feedback to complete</h2>
          {pendingFeedback.length === 0 ? (
            <p className="text-muted-foreground">No unfinished interview feedback</p>
          ) : (
            <div className="space-y-3">
              {pendingFeedback.map((interview) => (
                <div 
                  key={interview.id} 
                  className="flex items-center justify-between py-3 border-b last:border-b-0"
                >
                  <div className="flex items-center gap-4">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground w-32">
                      {format(new Date(interview.scheduled_at), "MMM d h:mma")} IST
                    </span>
                    <div>
                      <span className="font-medium">{interview.applicant?.name}</span>
                      <span className="text-muted-foreground ml-2 text-sm">
                        {interview.job?.title}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground capitalize">
                      {interview.interview_type} Interview
                    </span>
                    <Link to={`/interview/${interview.id}/feedback`}>
                      <Button variant="outline" size="sm">
                        SUBMIT
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Upcoming interviews */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4">Upcoming interviews</h2>
          {upcomingInterviews.length === 0 ? (
            <p className="text-muted-foreground">Not scheduled for any upcoming interviews</p>
          ) : (
            <div className="space-y-3">
              {upcomingInterviews.map((interview) => (
                <div 
                  key={interview.id} 
                  className="flex items-center justify-between py-3 border-b last:border-b-0"
                >
                  <div className="flex items-center gap-4">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground w-32">
                      {format(new Date(interview.scheduled_at), "MMM d h:mma")} IST
                    </span>
                    <div>
                      <span className="font-medium">{interview.applicant?.name}</span>
                      <span className="text-muted-foreground ml-2 text-sm">
                        {interview.job?.title}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground capitalize">
                      {interview.interview_type} Interview
                    </span>
                    <Button variant="outline" size="sm">
                      VIEW
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Recently completed feedback */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Recently completed feedback</h2>
          {completedFeedback.length === 0 ? (
            <p className="text-muted-foreground">No completed feedback yet</p>
          ) : (
            <div className="space-y-3">
              {completedFeedback.map((feedback) => (
                <div 
                  key={feedback.id} 
                  className="flex items-center justify-between py-3 border-b last:border-b-0"
                >
                  <div className="flex items-center gap-4">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground w-32">
                      {format(new Date(feedback.submitted_at), "MMM d h:mma")} IST
                    </span>
                    <div>
                      <span className="font-medium">{feedback.interview?.applicant?.name}</span>
                      <span className="text-muted-foreground ml-2 text-sm">
                        {feedback.interview?.job?.title}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground capitalize">
                      {feedback.interview?.interview_type} Interview
                    </span>
                    <Button variant="outline" size="sm">
                      VIEW
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Interviews;