import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  User, Mail, Phone, MapPin, Building2, Linkedin, Github, Globe, 
  FileText, Calendar, ExternalLink, CheckCircle, XCircle, Clock
} from 'lucide-react';

interface Application {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  current_location: string | null;
  current_company: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  portfolio_url: string | null;
  other_website: string | null;
  eligibility_to_work: boolean | null;
  cover_letter: string | null;
  consent_to_contact: boolean | null;
  resume_url: string;
  status: string | null;
  created_at: string | null;
  job_id: string;
}

interface ApplicationsViewerProps {
  jobId: string;
  jobTitle: string;
}

const ApplicationsViewer = ({ jobId, jobTitle }: ApplicationsViewerProps) => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchApplications();
  }, [jobId]);

  const fetchApplications = async () => {
    setLoading(true);
    setErrorMsg(null);

    const { data, error } = await supabase
      .from('public_applications')
      .select('*')
      .eq('job_id', jobId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching applications:', error);
      setApplications([]);
      setErrorMsg(error.message || 'Failed to load applications.');
    } else {
      setApplications(data || []);
    }

    setLoading(false);
  };

  const updateStatus = async (appId: string, newStatus: string) => {
    const { error } = await supabase
      .from('public_applications')
      .update({ status: newStatus })
      .eq('id', appId);

    if (!error) {
      setApplications(apps => 
        apps.map(app => app.id === appId ? { ...app, status: newStatus } : app)
      );
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'reviewed':
        return <Badge className="bg-blue-100 text-blue-700">Reviewed</Badge>;
      case 'shortlisted':
        return <Badge className="bg-green-100 text-green-700">Shortlisted</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const getStoragePathFromResumeValue = (value: string) => {
    // value can be either:
    // - a full URL like: https://.../storage/v1/object/public/resumes/<path>
    // - a plain storage path like: <jobId>/<file>.pdf
    const marker = '/resumes/';
    const idx = value.indexOf(marker);
    if (idx !== -1) return decodeURIComponent(value.slice(idx + marker.length));
    return value;
  };

  const openResume = async (resumeValue: string) => {
    try {
      const path = getStoragePathFromResumeValue(resumeValue);
      const { data, error } = await supabase.storage
        .from('resumes')
        .createSignedUrl(path, 60, { download: true });

      if (error) throw error;
      window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
    } catch (e) {
      console.error('Error opening resume:', e);
    }
  };

  if (loading) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        Loading applications...
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-destructive mb-3">{errorMsg}</p>
        <Button size="sm" variant="outline" onClick={fetchApplications}>
          Retry
        </Button>
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        <User className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>No applications received yet for this position.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">
          Applications for {jobTitle} ({applications.length})
        </h3>
      </div>

      {applications.map((app) => (
        <Card key={app.id} className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">{app.full_name}</CardTitle>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {app.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(app.status)}
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {app.created_at ? new Date(app.created_at).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Quick Info Row */}
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
              {app.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  {app.phone}
                </span>
              )}
              {app.current_location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {app.current_location}
                </span>
              )}
              {app.current_company && (
                <span className="flex items-center gap-1">
                  <Building2 className="h-4 w-4" />
                  {app.current_company}
                </span>
              )}
            </div>

            {/* Links */}
            <div className="flex flex-wrap gap-2 mb-4">
              <Button
                size="sm"
                variant="outline"
                className="gap-1"
                onClick={() => openResume(app.resume_url)}
              >
                <FileText className="h-4 w-4" />
                Resume
                <ExternalLink className="h-3 w-3" />
              </Button>
              {app.linkedin_url && (
                <a href={app.linkedin_url} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline" className="gap-1">
                    <Linkedin className="h-4 w-4" />
                    LinkedIn
                  </Button>
                </a>
              )}
              {app.github_url && (
                <a href={app.github_url} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline" className="gap-1">
                    <Github className="h-4 w-4" />
                    GitHub
                  </Button>
                </a>
              )}
              {app.portfolio_url && (
                <a href={app.portfolio_url} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline" className="gap-1">
                    <Globe className="h-4 w-4" />
                    Portfolio
                  </Button>
                </a>
              )}
            </div>

            {/* Eligibility */}
            <div className="flex items-center gap-2 text-sm mb-4">
              {app.eligibility_to_work ? (
                <span className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  Eligible to work
                </span>
              ) : (
                <span className="flex items-center gap-1 text-red-600">
                  <XCircle className="h-4 w-4" />
                  Not eligible to work
                </span>
              )}
              {app.consent_to_contact && (
                <span className="text-muted-foreground">• Open to future opportunities</span>
              )}
            </div>

            {/* Cover Letter */}
            {app.cover_letter && (
              <div className="mb-4">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="p-0 h-auto text-primary"
                  onClick={() => setExpandedId(expandedId === app.id ? null : app.id)}
                >
                  {expandedId === app.id ? 'Hide' : 'Show'} Cover Letter
                </Button>
                {expandedId === app.id && (
                  <div className="mt-2 p-4 bg-muted rounded-lg text-sm whitespace-pre-wrap">
                    {app.cover_letter}
                  </div>
                )}
              </div>
            )}

            {/* Status Actions */}
            <div className="flex gap-2 pt-4 border-t">
              <Button 
                size="sm" 
                variant={app.status === 'reviewed' ? 'default' : 'outline'}
                onClick={() => updateStatus(app.id, 'reviewed')}
                className="gap-1"
              >
                <Clock className="h-4 w-4" />
                Mark Reviewed
              </Button>
              <Button 
                size="sm" 
                variant={app.status === 'shortlisted' ? 'default' : 'outline'}
                onClick={() => updateStatus(app.id, 'shortlisted')}
                className="gap-1 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4" />
                Shortlist
              </Button>
              <Button 
                size="sm" 
                variant={app.status === 'rejected' ? 'destructive' : 'outline'}
                onClick={() => updateStatus(app.id, 'rejected')}
                className="gap-1"
              >
                <XCircle className="h-4 w-4" />
                Reject
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ApplicationsViewer;
