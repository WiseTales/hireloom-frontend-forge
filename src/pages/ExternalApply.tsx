
import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2, CheckCircle2, Upload, FileText, X, Linkedin, MapPin, Briefcase, ArrowLeft
} from 'lucide-react';

interface JobInfo {
  id: string;
  title: string;
  description: string;
  location: string;
  type: string;
  company_id: string;
}

export default function ExternalApply() {
  const { companySlug, jobId } = useParams<{ companySlug: string; jobId: string }>();
  const { toast } = useToast();

  const [job, setJob] = useState<JobInfo | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [pageLoading, setPageLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (companySlug && jobId) {
      fetchJobData();
    }
  }, [companySlug, jobId]);

  const fetchJobData = async () => {
    setPageLoading(true);
    try {
      // Fetch job directly using Supabase
      const { data: jobData, error: jobErr } = await supabase
        .from('jobs')
        .select(`
          id, title, description, location, type, company_id,
          companies(name, slug)
        `)
        .eq('id', jobId)
        .eq('is_published', true)
        .single();

      if (jobErr || !jobData) {
        setNotFound(true);
        return;
      }

      // Verify slug matches if provided
      if (companySlug !== (jobData.companies as any)?.slug) {
        setNotFound(true);
        return;
      }

      setJob(jobData as any);
      setCompanyName((jobData.companies as any)?.name || '');
    } catch (err) {
      console.error("Error fetching job:", err);
      setNotFound(true);
    } finally {
      setPageLoading(false);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: 'File too large', description: 'Max 10MB', variant: 'destructive' });
        return;
      }
      setResumeFile(file);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim()) {
      toast({ title: 'Name and email are required', variant: 'destructive' });
      return;
    }
    if (!resumeFile) {
      toast({ title: 'Resume is required', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      // 1. Upload resume to storage
      const ext = resumeFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const path = `resumes/${fileName}`;

      const { error: uploadErr } = await supabase.storage
        .from('resumes')
        .upload(path, resumeFile);

      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage.from('resumes').getPublicUrl(path);

      // 2. Store in database table: applications
      const { error: insertErr } = await supabase.from('applications').insert({
        job_id: jobId!,
        company_slug: companySlug!,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
        resume_url: urlData.publicUrl,
        linkedin_url: linkedinUrl.trim() || null
      });

      if (insertErr) throw insertErr;

      setSubmitted(true);
      toast({ title: 'Success!', description: 'Your application has been submitted.' });
    } catch (err: any) {
      console.error("Submission error:", err);
      toast({ title: 'Submission failed', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Card className="max-w-md w-full shadow-lg border-0">
          <CardContent className="py-12 text-center">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Job Not Found</h2>
            <p className="text-slate-600">The position you're looking for might have been closed or doesn't exist.</p>
            <Button asChild className="mt-6" variant="outline">
              <Link to="/">Back to Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="max-w-md w-full shadow-xl border-0">
          <CardContent className="py-12 text-center">
            <div className="rounded-full bg-green-100 p-4 mb-6 mx-auto w-fit">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Application Sent!</h2>
            <p className="text-slate-600 mb-8">
              Thank you for applying for the <strong>{job?.title}</strong> role at {companyName}. We've received your details and will be in touch soon.
            </p>
            <Button asChild variant="outline">
              <Link to={`/company/${companySlug}`}>See other roles</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to={`/company/${companySlug}`} className="flex items-center gap-2 group">
            <ArrowLeft className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
            <span className="font-bold text-xl tracking-tight text-slate-900">{companyName} <span className="text-indigo-600">Careers</span></span>
          </Link>
          <span className="text-xs font-medium text-slate-400 uppercase tracking-widest hidden sm:inline">Powered by HireLoom</span>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <section>
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-0">{job?.type}</Badge>
                <Badge variant="outline" className="text-slate-500 border-slate-200">{job?.location}</Badge>
              </div>
              <h1 className="text-4xl font-extrabold text-slate-900 mb-6">{job?.title}</h1>

              <div className="prose prose-slate max-w-none">
                <h3 className="text-xl font-bold text-slate-800">Job Description</h3>
                <p className="text-md text-slate-600 whitespace-pre-wrap leading-relaxed">{job?.description}</p>
              </div>
            </section>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-24 shadow-xl border-0 overflow-hidden">
              <div className="h-2 bg-indigo-600" />
              <CardHeader className="pb-4">
                <CardTitle className="text-xl">Apply Now</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-semibold text-slate-700">Full Name *</Label>
                  <Input
                    id="name"
                    placeholder="Jane Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="border-slate-200 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold text-slate-700">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="jane@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="border-slate-200 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-semibold text-slate-700">Phone Number</Label>
                  <Input
                    id="phone"
                    placeholder="+1 (555) 000-0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="border-slate-200 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="linkedin" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Linkedin className="h-4 w-4 text-[#0077b5]" /> LinkedIn URL (Optional)
                  </Label>
                  <Input
                    id="linkedin"
                    placeholder="https://linkedin.com/in/username"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    className="border-slate-200 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-3 pt-2">
                  <Label className="text-sm font-semibold text-slate-700">Resume / CV *</Label>
                  <div
                    className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${resumeFile
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-slate-200 hover:border-indigo-400 hover:bg-slate-50'
                      }`}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    {resumeFile ? (
                      <div className="flex items-center justify-center gap-2">
                        <FileText className="h-5 w-5 text-indigo-600" />
                        <span className="text-sm font-medium text-indigo-700 truncate max-w-[150px]">{resumeFile.name}</span>
                        <X
                          className="h-4 w-4 text-slate-400 hover:text-red-500 ml-1"
                          onClick={(e) => { e.stopPropagation(); setResumeFile(null); }}
                        />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="h-6 w-6 mx-auto text-slate-400" />
                        <p className="text-xs font-medium text-slate-600">Click to upload or drag & drop</p>
                        <p className="text-[10px] text-slate-400 uppercase">PDF or DOCX (Max 10MB)</p>
                      </div>
                    )}
                  </div>
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-all shadow-md"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Application"
                  )}
                </Button>

                <p className="text-[10px] text-center text-slate-400 mt-4 leading-tight">
                  By submitting, you agree to our terms of service and privacy policy.
                  Your data will be securely stored and shared with the hiring team.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <footer className="py-12 border-t mt-20 bg-white">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} {companyName}. All rights reserved.
          </p>
          <p className="text-xs text-slate-400 mt-2 flex items-center justify-center gap-1">
            Technology by <span className="font-bold text-indigo-600">HireLoom</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
