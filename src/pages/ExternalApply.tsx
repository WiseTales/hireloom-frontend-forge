import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2, CheckCircle2, Upload, FileText, X, Sparkles, Linkedin, MapPin, Briefcase, ArrowLeft,
} from 'lucide-react';

interface CompanyInfo {
  name: string;
  logo: string | null;
  description: string | null;
}

interface JobInfo {
  jobId: string;
  title: string;
  description: string;
  location: string;
  employmentType: string;
  category: string;
  salary: string | null;
  isRemote: boolean;
  locationType: string | null;
  experienceLevel: string | null;
}

export default function ExternalApply() {
  const { companySlug, jobId } = useParams<{ companySlug: string; jobId: string }>();
  const { toast } = useToast();

  const [company, setCompany] = useState<CompanyInfo | null>(null);
  const [job, setJob] = useState<JobInfo | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [headline, setHeadline] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [consentChecked, setConsentChecked] = useState(false);

  const [autofilling, setAutofilling] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchJobData();
  }, [companySlug, jobId]);

  const fetchJobData = async () => {
    setPageLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('public-jobs', {
        body: null,
        method: 'GET',
        headers: {},
      });

      // Use fetch directly since functions.invoke doesn't support query params well
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/public-jobs?companySlug=${companySlug}`,
        { headers: { 'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY } }
      );

      if (!res.ok) { setNotFound(true); return; }

      const result = await res.json();
      setCompany(result.company);

      const found = result.jobs?.find((j: JobInfo) => j.jobId === jobId);
      if (!found) { setNotFound(true); return; }
      setJob(found);
    } catch {
      setNotFound(true);
    } finally {
      setPageLoading(false);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: 'File too large', description: 'Max 5MB', variant: 'destructive' });
        return;
      }
      setResumeFile(file);
    }
  };

  const handleAutofill = async () => {
    if (!resumeFile) {
      toast({ title: 'Upload resume first', variant: 'destructive' });
      return;
    }
    if (!consentChecked) {
      toast({ title: 'Consent required', description: 'Please consent to AI processing', variant: 'destructive' });
      return;
    }

    setAutofilling(true);
    try {
      const text = await resumeFile.text();
      const { data, error } = await supabase.functions.invoke('profile-autofill', {
        body: { resumeText: text, linkedinUrl: linkedinUrl.trim() || null },
      });
      if (error || !data?.success) throw new Error('Extraction failed');

      const d = data.data;
      setFullName(d.full_name || fullName);
      setEmail(d.email || email);
      setPhone(d.phone || phone);
      setLocation(d.location || location);
      setHeadline(d.headline || headline);
      if (d.professional_summary) setCoverLetter(d.professional_summary);

      toast({ title: 'Autofilled ✨', description: 'Review your details below.' });
    } catch {
      toast({ title: 'AI error', description: 'Please fill manually.', variant: 'destructive' });
    } finally {
      setAutofilling(false);
    }
  };

  const handleSubmit = async () => {
    if (!fullName.trim() || !email.trim()) {
      toast({ title: 'Name and email required', variant: 'destructive' });
      return;
    }
    if (!resumeFile) {
      toast({ title: 'Resume is required', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      // Upload resume
      const ext = resumeFile.name.split('.').pop();
      const path = `resumes/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from('resumes').upload(path, resumeFile);
      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage.from('resumes').getPublicUrl(path);

      // Insert application
      const { error: insertErr } = await supabase.from('public_applications').insert({
        job_id: jobId!,
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
        current_location: location.trim() || null,
        current_company: headline.trim() || null,
        cover_letter: coverLetter.trim() || null,
        linkedin_url: linkedinUrl.trim() || null,
        resume_url: urlData.publicUrl,
        source: 'external_careers',
        status: 'applied',
      });

      if (insertErr) throw insertErr;

      setSubmitted(true);
    } catch (err: any) {
      toast({ title: 'Submission failed', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <h2 className="text-2xl font-bold mb-2">Job Not Found</h2>
            <p className="text-muted-foreground">This position may no longer be available.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <div className="rounded-full bg-primary/10 p-3 mb-4 mx-auto w-fit">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Application Submitted!</h2>
            <p className="text-muted-foreground">
              Thank you for applying to <strong>{job?.title}</strong> at <strong>{company?.name}</strong>.
            </p>
          </CardContent>
        </Card>
        <footer className="fixed bottom-0 inset-x-0 py-3 text-center text-xs text-muted-foreground border-t bg-background">
          Powered by <span className="font-semibold text-primary">HireLoom</span>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Co-branded header */}
      <header className="bg-background border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {company?.logo && (
              <img src={company.logo} alt={company.name} className="h-8 w-8 rounded object-contain" />
            )}
            <span className="font-heading font-bold text-lg">{company?.name}</span>
          </div>
          <span className="text-xs text-muted-foreground">Powered by <span className="font-semibold text-primary">HireLoom</span></span>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Job summary */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex flex-wrap gap-2 mb-2">
              <Badge variant="secondary">{job?.employmentType}</Badge>
              {job?.isRemote && <Badge variant="outline">Remote</Badge>}
              {job?.experienceLevel && <Badge variant="outline">{job.experienceLevel}</Badge>}
            </div>
            <CardTitle className="text-2xl">{job?.title}</CardTitle>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{job?.location}</span>
              <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" />{job?.category}</span>
              {job?.salary && <span>{job.salary}</span>}
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-6">{job?.description}</p>
          </CardContent>
        </Card>

        {/* Application form */}
        <Card>
          <CardHeader>
            <CardTitle>Apply for this position</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Resume upload */}
            <div className="space-y-3">
              <Label className="font-semibold">Resume *</Label>
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  resumeFile ? 'border-primary bg-primary/5' : 'border-muted-foreground/20 hover:border-primary/50'
                }`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) setResumeFile(f); }}
              >
                <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.txt" onChange={handleFileChange} className="hidden" />
                {resumeFile ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileText className="h-6 w-6 text-primary" />
                    <span className="font-medium text-primary">{resumeFile.name}</span>
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setResumeFile(null); }}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                    <p className="font-medium">Drop resume or click to upload</p>
                    <p className="text-xs text-muted-foreground">PDF, DOCX, TXT — Max 5MB</p>
                  </div>
                )}
              </div>
            </div>

            {/* LinkedIn */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Linkedin className="h-4 w-4 text-[#0077b5]" /> LinkedIn URL (optional)</Label>
              <Input placeholder="https://linkedin.com/in/you" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} />
            </div>

            {/* AI consent + autofill */}
            <div className="flex items-start gap-3 p-3 bg-muted/40 rounded-lg border">
              <input type="checkbox" id="ai-consent" checked={consentChecked} onChange={(e) => setConsentChecked(e.target.checked)} className="mt-1" />
              <Label htmlFor="ai-consent" className="text-xs text-muted-foreground cursor-pointer">
                I consent to AI analysis of my resume for autofilling this form. Data is processed temporarily.
              </Label>
            </div>
            <Button
              variant="outline"
              onClick={handleAutofill}
              disabled={!resumeFile || !consentChecked || autofilling}
              className="w-full"
            >
              {autofilling ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
              {autofilling ? 'Analyzing…' : 'Autofill with AI ✨'}
            </Button>

            {/* Form fields */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name *</Label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jane Doe" />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@example.com" />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 234 567 890" />
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, Country" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Current Role / Headline</Label>
              <Input value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="Senior Engineer at Acme" />
            </div>

            <div className="space-y-2">
              <Label>Cover Letter / Summary</Label>
              <Textarea value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)} rows={4} placeholder="Brief professional background…" />
            </div>

            <Button onClick={handleSubmit} disabled={submitting} className="w-full h-12 text-lg font-bold">
              {submitting ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : null}
              Submit Application
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* HireLoom footer */}
      <footer className="py-6 text-center text-xs text-muted-foreground border-t mt-12 bg-background">
        Powered by <span className="font-semibold text-primary">HireLoom</span> — The modern hiring platform
      </footer>
    </div>
  );
}
