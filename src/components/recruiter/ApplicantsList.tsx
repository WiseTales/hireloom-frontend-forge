import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, Phone, MapPin, Building2, Linkedin, FileText, ExternalLink, Calendar, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Application {
  id: string;
  job_id: string;
  job_title?: string;
  full_name: string;
  email: string;
  phone: string | null;
  location: string | null;
  current_company: string | null;
  cover_letter: string | null;
  resume_url: string | null;
  linkedin_url: string | null;
  status: string | null;
  created_at: string;
  type: 'public' | 'auth';
}

export const ApplicantsList = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      // 1. Fetch public applications
      const { data: publicApps, error: publicError } = await supabase
        .from('public_applications')
        .select('*, jobs(title)')
        .order('created_at', { ascending: false });

      if (publicError) throw publicError;

      // 2. Fetch authenticated applications (we'll need to join with profiles)
      const { data: authApps, error: authError } = await supabase
        .from('job_applications')
        .select('*, jobs(title), profiles(full_name, email, headline, bio, resume_url)')
        .order('applied_at', { ascending: false });

      if (authError) throw authError;

      // Combine and map
      const mappedPublic: Application[] = (publicApps || []).map(app => ({
        id: app.id,
        job_id: app.job_id,
        job_title: (app.jobs as any)?.title,
        full_name: app.full_name,
        email: app.email,
        phone: app.phone,
        location: app.current_location,
        current_company: app.current_company,
        cover_letter: app.cover_letter,
        resume_url: app.resume_url,
        linkedin_url: app.linkedin_url,
        status: app.status,
        created_at: app.created_at || '',
        type: 'public'
      }));

      const mappedAuth: Application[] = (authApps || []).map(app => ({
        id: app.id,
        job_id: app.job_id,
        job_title: (app.jobs as any)?.title,
        full_name: (app.profiles as any)?.full_name || app.applicant_name,
        email: (app.profiles as any)?.email || app.applicant_email,
        phone: null, // job_applications table lacks phone
        location: null, // job_applications table lacks location
        current_company: (app.profiles as any)?.headline,
        cover_letter: (app.profiles as any)?.bio,
        resume_url: (app.profiles as any)?.resume_url,
        linkedin_url: null,
        status: app.status,
        created_at: app.applied_at,
        type: 'auth'
      }));

      const combined = [...mappedPublic, ...mappedAuth].sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setApplications(combined);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, type: 'public' | 'auth', newStatus: string) => {
    try {
      const table = type === 'public' ? 'public_applications' : 'job_applications';
      const { error } = await supabase
        .from(table as any)
        .update({ status: newStatus } as any)
        .eq('id', id);

      if (error) throw error;

      setApplications(prev => prev.map(app =>
        app.id === id ? { ...app, status: newStatus } : app
      ));
      toast.success(`Status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Clock className="animate-spin h-8 w-8 text-primary" /></div>;
  }

  if (applications.length === 0) {
    return (
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="py-12 text-center">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
          <h3 className="text-xl font-semibold text-muted-foreground">No applications yet</h3>
          <p className="text-sm text-muted-foreground">Wait for candidates to apply to your job postings.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6">
      {applications.map((app) => (
        <Card key={app.id} className="overflow-hidden border-l-4 border-l-primary hover:shadow-lg transition-all">
          <CardHeader className="bg-muted/20 pb-4">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="bg-white">{app.job_title}</Badge>
                  <Badge className={app.status === 'applied' ? 'bg-blue-500' : app.status === 'shortlisted' ? 'bg-green-500' : 'bg-gray-500'}>
                    {app.status || 'Pending'}
                  </Badge>
                  {app.type === 'auth' && <Badge variant="secondary" className="text-[10px]">VERIFIED USER</Badge>}
                </div>
                <CardTitle className="text-2xl font-bold">{app.full_name}</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <Mail className="h-3 w-3" /> {app.email}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => updateStatus(app.id, app.type, 'shortlisted')}>
                  <CheckCircle2 className="h-4 w-4 mr-1 text-green-500" /> Shortlist
                </Button>
                <Button size="sm" variant="outline" onClick={() => updateStatus(app.id, app.type, 'rejected')}>
                  <XCircle className="h-4 w-4 mr-1 text-red-500" /> Reject
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Contact Details</p>
                    <div className="text-sm space-y-2">
                      <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary" /> {app.phone || 'Not provided'}</p>
                      <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> {app.location || 'Not provided'}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Professional Info</p>
                    <div className="text-sm space-y-2">
                      <p className="flex items-center gap-2"><Building2 className="h-4 w-4 text-primary" /> {app.current_company || 'Not provided'}</p>
                      <p className="flex items-center gap-2">
                        {app.linkedin_url ? (
                          <a href={app.linkedin_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-blue-600 hover:underline">
                            <Linkedin className="h-4 w-4" /> LinkedIn Profile
                          </a>
                        ) : (
                          <span className="flex items-center gap-2 opacity-50"><Linkedin className="h-4 w-4" /> No LinkedIn</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-muted/30 rounded-lg border border-muted-foreground/10">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Resume / Document</p>
                  {app.resume_url ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="h-8 w-8 text-primary" />
                        <div>
                          <p className="text-xs font-semibold">Resume_Snapshot.pdf</p>
                          <p className="text-[10px] text-muted-foreground">Uploaded via HireLoom AI</p>
                        </div>
                      </div>
                      <Button size="sm" variant="secondary" asChild>
                        <a href={app.resume_url} target="_blank" rel="noreferrer" className="flex items-center gap-2">
                          View Resume <ExternalLink className="h-3 w-3" />
                        </a>
                      </Button>
                    </div>
                  ) : (
                    <p className="text-sm italic text-muted-foreground">No document attached.</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Professional Summary</p>
                <div className="p-4 bg-white rounded-lg border text-sm leading-relaxed max-h-[150px] overflow-y-auto italic text-muted-foreground">
                  {app.cover_letter || "No cover letter or summary provided by candidate."}
                </div>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground pt-2">
                  <Calendar className="h-3 w-3" />
                  Applied on {new Date(app.created_at).toLocaleDateString()} at {new Date(app.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
import { Users } from 'lucide-react';
