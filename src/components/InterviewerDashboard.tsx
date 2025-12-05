import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, Clock, User, FileText, CheckCircle, AlertCircle, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

interface Interview {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  interview_type: string;
  status: string;
  meeting_link: string | null;
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
  overall_rating: number | null;
  recommendation: string | null;
  submitted_at: string;
  interview: Interview | null;
}

const InterviewerDashboard = () => {
  const { user } = useAuth();
  const [upcomingInterviews, setUpcomingInterviews] = useState<Interview[]>([]);
  const [pendingFeedback, setPendingFeedback] = useState<Interview[]>([]);
  const [completedFeedback, setCompletedFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    
    try {
      // Fetch upcoming interviews
      const { data: interviews, error: interviewsError } = await supabase
        .from('interviews')
        .select(`
          *,
          applicant:applicants(id, name, email),
          job:jobs(id, title, company)
        `)
        .eq('interviewer_id', user.id)
        .gte('scheduled_at', new Date().toISOString())
        .eq('status', 'scheduled')
        .order('scheduled_at', { ascending: true });

      if (interviewsError) throw interviewsError;
      setUpcomingInterviews(interviews || []);

      // Fetch interviews needing feedback (completed but no feedback submitted)
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
        .order('submitted_at', { ascending: false })
        .limit(10);

      if (allFeedbackError) throw allFeedbackError;
      setCompletedFeedback(allFeedback || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRecommendationBadge = (recommendation: string | null) => {
    switch (recommendation) {
      case 'strong_hire':
        return <Badge className="bg-green-500">Strong Hire</Badge>;
      case 'hire':
        return <Badge className="bg-green-400">Hire</Badge>;
      case 'no_hire':
        return <Badge className="bg-red-400">No Hire</Badge>;
      case 'strong_no_hire':
        return <Badge className="bg-red-500">Strong No Hire</Badge>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Welcome Header */}
      <div className="bg-foreground text-background rounded-lg p-6 mb-8">
        <h1 className="text-2xl font-bold">Welcome back!</h1>
        <p className="text-muted">
          {format(new Date(), "MMMM d, yyyy 'at' h:mm a")}
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* My Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">My tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span>{pendingFeedback.length} feedback forms to complete</span>
              </div>
              {pendingFeedback.length === 0 ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-500" />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Interviews */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Upcoming interviews</CardTitle>
            <Link to="/interviews" className="text-primary text-sm hover:underline">
              View all interviews
            </Link>
          </CardHeader>
          <CardContent>
            {upcomingInterviews.length === 0 ? (
              <p className="text-muted-foreground text-sm">You have no interviews scheduled.</p>
            ) : (
              <div className="space-y-3">
                {upcomingInterviews.slice(0, 3).map((interview) => (
                  <div key={interview.id} className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                    <div>
                      <p className="font-medium">{interview.applicant?.name}</p>
                      <p className="text-sm text-muted-foreground">{interview.job?.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(interview.scheduled_at), "MMM d 'at' h:mm a")}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Links */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link to="/jobs" className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
              <span>Internal job board</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
            <Link to="/referrals" className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
              <span>Refer a candidate</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Feedback Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Feedback</CardTitle>
          <Link to="/interviews" className="text-primary text-sm hover:underline">
            View all interviews
          </Link>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="outstanding">
            <TabsList>
              <TabsTrigger value="outstanding">
                Outstanding feedback <Badge variant="secondary" className="ml-2">{pendingFeedback.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="completed">
                Completed feedback <Badge variant="secondary" className="ml-2">{completedFeedback.length}</Badge>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="outstanding" className="mt-4">
              {pendingFeedback.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  You do not have any outstanding feedback forms to complete.
                </p>
              ) : (
                <div className="space-y-2">
                  {pendingFeedback.map((interview) => (
                    <div key={interview.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{interview.applicant?.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {interview.job?.title} • {interview.interview_type}
                          </p>
                        </div>
                      </div>
                      <Link to={`/interview/${interview.id}/feedback`}>
                        <Button size="sm" variant="outline">Submit Feedback</Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
            <TabsContent value="completed" className="mt-4">
              {completedFeedback.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No completed feedback yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {completedFeedback.map((feedback) => (
                    <div key={feedback.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(feedback.submitted_at), "MMM d h:mm a")}
                          </p>
                          <p className="font-medium">{feedback.interview?.applicant?.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {feedback.interview?.job?.title} • {feedback.interview?.interview_type}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getRecommendationBadge(feedback.recommendation)}
                        <Button size="sm" variant="ghost">VIEW</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default InterviewerDashboard;