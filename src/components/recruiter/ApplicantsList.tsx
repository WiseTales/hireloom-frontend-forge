
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, Phone, Linkedin, FileText, ExternalLink, Calendar, CheckCircle2, Clock, XCircle, Globe } from 'lucide-react';
import { toast } from 'sonner';

interface Application {
  id: string;
  job_id: string;
  job_title?: string;
  name: string;
  email: string;
  phone: string | null;
  resume_url: string | null;
  linkedin_url: string | null;
  created_at: string;
  status?: string; // We'll add this to the UI logically even if table is simple
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
      const { data, error } = await supabase
        .from('applications')
        .select('*, jobs(title)')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mapped: Application[] = (data || []).map(app => ({
        id: app.id,
        job_id: app.job_id,
        job_title: (app.jobs as any)?.title || 'Unknown Position',
        name: app.name,
        email: app.email,
        phone: app.phone,
        resume_url: app.resume_url,
        linkedin_url: app.linkedin_url,
        created_at: app.created_at,
        status: 'applied' // Default for now since we simplified table
      }));

      setApplications(mapped);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Clock className="animate-spin h-8 w-8 text-primary" /></div>;
  }

  if (applications.length === 0) {
    return (
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="py-12 text-center">
          <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
          <h3 className="text-xl font-semibold text-muted-foreground">No applications yet</h3>
          <p className="text-sm text-muted-foreground">Wait for candidates to apply through your careers page.</p>
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
                  <Badge className="bg-blue-500/10 text-blue-600 border-blue-200">New</Badge>
                </div>
                <CardTitle className="text-2xl font-bold">{app.name}</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1 font-medium">
                  <Mail className="h-3 w-3" /> {app.email}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground hidden md:inline">Received via Careers Page</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Contact Details</p>
                    <div className="text-sm space-y-2">
                      <p className="flex items-center gap-2 font-medium"><Phone className="h-4 w-4 text-primary" /> {app.phone || 'Not provided'}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Social Profiles</p>
                    <div className="text-sm">
                      {app.linkedin_url ? (
                        <a href={app.linkedin_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-blue-600 font-medium hover:underline">
                          <Linkedin className="h-4 w-4" /> LinkedIn Profile
                        </a>
                      ) : (
                        <span className="flex items-center gap-2 opacity-50 text-muted-foreground"><Linkedin className="h-4 w-4" /> No LinkedIn</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">Resume Document</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-semibold">PDF / Word</p>
                    </div>
                  </div>
                  <Button size="sm" className="bg-white text-slate-900 border hover:bg-slate-50" asChild>
                    <a href={app.resume_url || '#'} target="_blank" rel="noreferrer" className="flex items-center gap-2">
                      Download / View <ExternalLink className="h-3 w-3" />
                    </a>
                  </Button>
                </div>
              </div>

              <div className="flex flex-col justify-end items-end space-y-4">
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Applied Date</p>
                  <p className="text-sm font-medium">{new Date(app.created_at).toLocaleDateString()}</p>
                  <p className="text-[10px] text-muted-foreground">{new Date(app.created_at).toLocaleTimeString()}</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                  <Button variant="outline" className="flex-1 md:flex-none border-green-200 text-green-700 hover:bg-green-50">Shortlist</Button>
                  <Button variant="outline" className="flex-1 md:flex-none border-red-200 text-red-700 hover:bg-red-50">Pass</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
