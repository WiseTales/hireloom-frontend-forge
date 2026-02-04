import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { JobApplyModal } from '@/components/jobs/JobApplyModal';
import { ArrowLeft, MapPin, Building2, Clock, Briefcase, DollarSign, Users, CheckCircle2 } from 'lucide-react';

interface Job {
  id: string;
  title: string;
  company: string;
  description: string;
  location: string;
  salary: string | null;
  type: string;
  category: string;
  experience_level: string | null;
  is_remote: boolean | null;
  employee_range: string | null;
  skills_required: string[] | null;
  location_type: string | null;
  work_type: string | null;
  team: string | null;
  department: string | null;
  created_at: string;
}

const JobDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);

  useEffect(() => {
    if (id) {
      fetchJob();
    }
  }, [id]);

  useEffect(() => {
    if (user && id) {
      checkApplicationStatus();
    }
  }, [user, id]);

  const fetchJob = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setJob(data);
    } catch (error) {
      console.error('Error fetching job:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkApplicationStatus = async () => {
    if (!user || !id) return;
    
    const { data } = await supabase
      .from('job_applications')
      .select('id')
      .eq('job_id', id)
      .eq('user_id', user.id)
      .single();
    
    setHasApplied(!!data);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const handleApplyClick = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/jobs/${id}` } });
      return;
    }
    setShowApplyModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-semibold mb-4">Job not found</h1>
        <Link to="/jobs">
          <Button>Back to Jobs</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/jobs" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to all jobs
          </Link>
          <Link to="/login">
            <Button variant="outline" size="sm">Sign In</Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-4">{job.title}</h1>
              <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Building2 className="h-4 w-4" />
                  {job.company}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {job.location}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {job.category} – {job.department || job.category} / {job.work_type || job.type} / {job.location_type || (job.is_remote ? 'Remote' : 'On-site')}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{job.category}</Badge>
              <Badge variant="outline">{job.work_type || job.type}</Badge>
              {job.location_type && <Badge variant="outline" className="capitalize">{job.location_type}</Badge>}
              {job.team && <Badge variant="outline">{job.team}</Badge>}
            </div>

            <Separator />

            <div>
              <h2 className="text-xl font-semibold mb-4">Job Description</h2>
              <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-wrap">
                {job.description}
              </div>
            </div>

            {job.skills_required && job.skills_required.length > 0 && (
              <>
                <Separator />
                <div>
                  <h2 className="text-xl font-semibold mb-4">Required Skills</h2>
                  <div className="flex flex-wrap gap-2">
                    {job.skills_required.map((skill, index) => (
                      <Badge key={index} variant="secondary">{skill}</Badge>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Apply for this job</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {hasApplied ? (
                  <div className="flex flex-col items-center py-4">
                    <div className="rounded-full bg-green-100 p-2 mb-3">
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                    </div>
                    <p className="font-medium text-center">Application Submitted</p>
                    <p className="text-xs text-muted-foreground text-center mt-1">
                      You have already applied for this position.
                    </p>
                  </div>
                ) : (
                  <>
                    <Button className="w-full" onClick={handleApplyClick}>
                      Apply Now
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      Your profile and resume will be shared with the employer.
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Job Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Briefcase className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Work Type</p>
                    <p className="font-medium capitalize">{job.work_type || job.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Location Type</p>
                    <p className="font-medium capitalize">{job.location_type || (job.is_remote ? 'Remote' : 'On-site')}</p>
                  </div>
                </div>
                {job.salary && (
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Salary</p>
                      <p className="font-medium">{job.salary}</p>
                    </div>
                  </div>
                )}
                {job.employee_range && (
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Company Size</p>
                      <p className="font-medium">{job.employee_range}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Posted</p>
                    <p className="font-medium">{formatDate(job.created_at)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Apply Modal */}
      {job && (
        <JobApplyModal
          open={showApplyModal}
          onOpenChange={setShowApplyModal}
          job={{ id: job.id, title: job.title, company: job.company }}
          onSuccess={() => setHasApplied(true)}
        />
      )}
    </div>
  );
};

export default JobDetail;
