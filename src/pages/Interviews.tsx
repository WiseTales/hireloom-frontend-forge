import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, Clock, User, Video, MapPin, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

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

const Interviews = () => {
  const { user, userRole } = useAuth();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchInterviews();
    }
  }, [user, userRole]);

  const fetchInterviews = async () => {
    if (!user) return;
    
    try {
      let query = supabase
        .from('interviews')
        .select(`
          *,
          applicant:applicants(id, name, email),
          job:jobs(id, title, company)
        `)
        .order('scheduled_at', { ascending: true });

      // If interviewer, only show their interviews
      if (userRole === 'interviewer') {
        query = query.eq('interviewer_id', user.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setInterviews(data || []);
    } catch (error) {
      console.error('Error fetching interviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const upcomingInterviews = interviews.filter(
    i => new Date(i.scheduled_at) >= new Date() && i.status === 'scheduled'
  );
  
  const completedInterviews = interviews.filter(
    i => i.status === 'completed'
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge className="bg-blue-500">Scheduled</Badge>;
      case 'completed':
        return <Badge className="bg-green-500">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      case 'no_show':
        return <Badge variant="outline">No Show</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'phone':
        return <Badge variant="outline">Phone</Badge>;
      case 'video':
        return <Badge variant="outline">Video</Badge>;
      case 'panel':
        return <Badge variant="outline">Panel</Badge>;
      case 'technical':
        return <Badge variant="outline">Technical</Badge>;
      case 'hr':
        return <Badge variant="outline">HR</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Interviews</h1>
          <p className="text-muted-foreground">
            {userRole === 'interviewer' ? 'Your scheduled interviews' : 'All scheduled interviews'}
          </p>
        </div>
      </div>

      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">
            Upcoming <Badge variant="secondary" className="ml-2">{upcomingInterviews.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed <Badge variant="secondary" className="ml-2">{completedInterviews.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-6">
          {upcomingInterviews.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No upcoming interviews scheduled</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {upcomingInterviews.map((interview) => (
                <Card key={interview.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(interview.scheduled_at), "EEEE, MMMM d 'at' h:mm a")}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            ({interview.duration_minutes} min)
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold">{interview.applicant?.name}</h3>
                        <p className="text-muted-foreground">
                          {interview.job?.title} at {interview.job?.company}
                        </p>
                        <div className="flex items-center gap-2">
                          {getTypeBadge(interview.interview_type)}
                          {getStatusBadge(interview.status)}
                        </div>
                        {interview.meeting_link && (
                          <a
                            href={interview.meeting_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-primary hover:underline text-sm"
                          >
                            <Video className="h-4 w-4" />
                            Join Meeting
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                        {interview.location && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            {interview.location}
                          </div>
                        )}
                      </div>
                      <Button variant="outline" size="sm">View Details</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          {completedInterviews.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No completed interviews yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {completedInterviews.map((interview) => (
                <Card key={interview.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(interview.scheduled_at), "MMMM d, yyyy 'at' h:mm a")}
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold">{interview.applicant?.name}</h3>
                        <p className="text-muted-foreground">
                          {interview.job?.title} at {interview.job?.company}
                        </p>
                        <div className="flex items-center gap-2">
                          {getTypeBadge(interview.interview_type)}
                          {getStatusBadge(interview.status)}
                        </div>
                      </div>
                      <Link to={`/interview/${interview.id}/feedback`}>
                        <Button size="sm">
                          {userRole === 'interviewer' ? 'Submit Feedback' : 'View Feedback'}
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Interviews;