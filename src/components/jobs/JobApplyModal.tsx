import { useState, useEffect, useRef, ChangeEvent, DragEvent } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, CheckCircle2, User, Mail, FileText, Sparkles, Upload, Linkedin, X } from 'lucide-react';
import { createNotification } from '@/hooks/useNotifications';

interface JobApplyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: {
    id: string;
    title: string;
    company: string;
  };
  onSuccess?: () => void;
}

interface ExtractedProfile {
  full_name: string | null;
  professional_headline: string | null;
  headline: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  total_experience_years: number | null;
  experience: any[] | null;
  education: any[] | null;
  skills_technical: string[] | null;
  skills_soft: string[] | null;
  tools_and_technologies: string[] | null;
  certifications: string[] | null;
  projects: any[] | null;
  portfolio_links: string[] | null;
  languages: string[] | null;
  summary: string | null;
}

// Improved text extraction from file (PDF/DOCX/TXT)
async function extractTextFromFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result;
        if (!content) return resolve('');

        if (file.type === 'text/plain') {
          resolve(content as string);
          return;
        }

        if (content instanceof ArrayBuffer) {
          // Attempt to extract text from PDF/DOCX using a more robust regex-based approach
          // Note: Browser-side extraction without libraries is inherently limited.
          const decoder = new TextDecoder('utf-8', { fatal: false });
          let text = decoder.decode(content);

          if (file.type === 'application/pdf') {
            // PDF parsing via regex is tricky, but let's try to catch more text blocks
            const textParts: string[] = [];

            // Extract text in parentheses (common in PDF)
            const matches = text.match(/\(([^)]+)\)/g);
            if (matches) {
              matches.forEach(m => {
                const inner = m.slice(1, -1).trim();
                if (inner.length > 1) textParts.push(inner);
              });
            }

            // Extract text in BT ... ET blocks
            const btEtBlocks = text.match(/BT[\s\S]*?ET/g);
            if (btEtBlocks) {
              btEtBlocks.forEach(block => {
                const cleaned = block.replace(/\[[^\]]*\]/g, ' ').replace(/\([^)]*\)/g, (match) => match.slice(1, -1));
                textParts.push(cleaned);
              });
            }

            text = textParts.join(' ').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, ' ').replace(/\s+/g, ' ').trim();
          }

          // If we still have very little text, the PDF might be encrypted or using complex encoding
          if (text.length < 100 && file.type === 'application/pdf') {
            console.warn('PDF extraction resulted in very little text. This PDF might require a more advanced parser.');
          }

          resolve(text);
        } else {
          resolve(String(content));
        }
      } catch (err) { reject(err); }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    if (file.type === 'text/plain') reader.readAsText(file);
    else reader.readAsArrayBuffer(file);
  });
}

export const JobApplyModal = ({ open, onOpenChange, job, onSuccess }: JobApplyModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [autofilling, setAutofilling] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [step, setStep] = useState<'upload' | 'form'>('upload');

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [headline, setHeadline] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');

  const [hasApplied, setHasApplied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      if (user) {
        fetchProfile();
        setStep('form');
      } else {
        setStep('upload');
      }
    }
  }, [open, user]);

  const fetchProfile = async () => {
    if (!user) return;
    const { data } = await supabase.from('profiles').select('full_name, email, headline, bio').eq('id', user.id).single();
    if (data) {
      setFullName(data.full_name || '');
      setEmail(data.email || '');
      setHeadline(data.headline || '');
      setCoverLetter(data.bio || '');
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: 'File too large', description: 'Maximum size is 5MB', variant: 'destructive' });
        return;
      }
      setResumeFile(file);
    }
  };

  const handleAutofill = async () => {
    if (!resumeFile) {
      toast({ title: 'Resume required', description: 'Please upload a resume for AI autofill', variant: 'destructive' });
      return;
    }

    if (!consentChecked) {
      toast({ title: 'Consent Required', description: 'Please provide consent for AI processing', variant: 'destructive' });
      return;
    }

    setAutofilling(true);
    try {
      const resumeText = await extractTextFromFile(resumeFile);
      const { data, error } = await supabase.functions.invoke('profile-autofill', {
        body: { resumeText, linkedinUrl: linkedinUrl.trim() || null }
      });

      if (error || !data.success) throw new Error(data?.error || 'Extraction failed');

      const extracted: ExtractedProfile = data.data;
      setFullName(extracted.full_name || fullName);
      setEmail(extracted.email || email);
      setHeadline(extracted.professional_headline || extracted.headline || headline);
      setPhone(extracted.phone || phone);
      setLocation(extracted.location || location);
      if (extracted.summary) setCoverLetter(extracted.summary);

      setStep('form');
      toast({ title: 'Autofilled Successfully ✨', description: 'Please review and confirm your details.' });
    } catch (err) {
      console.error('Autofill error:', err);
      toast({ title: 'AI Autofill Error', description: 'We couldn\'t extract data. Please fill the form manually.', variant: 'destructive' });
      setStep('form');
    } finally {
      setAutofilling(false);
    }
  };

  const handleSubmit = async () => {
    if (!fullName || !email) {
      toast({ title: 'Required Fields', description: 'Please provide your name and email.', variant: 'destructive' });
      return;
    }

    console.log('Starting submission...', { fullName, email, phone, location, headline, hasResume: !!resumeFile, job_id: job.id });
    setLoading(true);
    try {
      let resumeUrl: string | null = null;
      if (resumeFile) {
        console.log('Uploading resume...', resumeFile.name);
        const fileExt = resumeFile.name.split('.').pop();
        const fileName = `${Math.random()}-${Date.now()}.${fileExt}`;
        const filePath = `resumes/${fileName}`;

        const { error: uploadError } = await supabase.storage.from('resumes').upload(filePath, resumeFile, {
          cacheControl: '3600',
          upsert: false
        });

        if (uploadError) {
          console.error('Resume upload failed:', uploadError);
          throw new Error(`Resume upload failed: ${uploadError.message}`);
        }

        const { data } = supabase.storage.from('resumes').getPublicUrl(filePath);
        resumeUrl = data.publicUrl;
        console.log('Resume uploaded successfully. URL:', resumeUrl);
      }

      if (user) {
        console.log('Inserting into job_applications for user:', user.id);
        const { error: appError } = await supabase.from('job_applications').insert({
          job_id: job.id,
          user_id: user.id,
          applicant_name: fullName.trim(),
          applicant_email: email.trim(),
          status: 'applied',
        });

        if (appError) {
          console.error('Auth application insert error:', appError);
          throw appError;
        }

        // Sync to profile
        console.log('Syncing data to profile...');
        await supabase.from('profiles').update({
          resume_url: resumeUrl || undefined,
          headline: headline.trim() || undefined,
          full_name: fullName.trim() || undefined,
          bio: coverLetter.trim() || undefined,
        }).eq('id', user.id);

        await createNotification({
          userId: user.id,
          type: 'job_application',
          title: 'Application Submitted',
          message: `Your application for ${job.title} at ${job.company} has been submitted successfully.`,
          link: '/applied',
        });
      } else {
        console.log('Inserting into public_applications for guest');
        if (!resumeUrl) {
          toast({
            title: 'Resume Required',
            description: 'Guest applications require a resume upload. Please go back and select a file.',
            variant: 'destructive'
          });
          setLoading(false);
          return;
        }

        const insertData = {
          job_id: job.id,
          full_name: fullName.trim(),
          email: email.trim(),
          cover_letter: coverLetter.trim() || null,
          status: 'applied',
          resume_url: resumeUrl,
          linkedin_url: linkedinUrl.trim() || null,
          phone: phone.trim() || null,
          current_location: location.trim() || null,
          current_company: headline.trim() || null,
        };
        console.log('Public insert data:', insertData);

        const { error: publicError } = await supabase.from('public_applications').insert(insertData);

        if (publicError) {
          console.error('Guest application insert error:', publicError);
          throw publicError;
        }
      }

      console.log('Application submitted successfully!');
      toast({ title: 'Application Submitted! 🎉', description: `Good luck with your application for ${job.title}.` });
      setHasApplied(true);
      onSuccess?.();
      setTimeout(() => onOpenChange(false), 2000);
    } catch (error: any) {
      console.error('SUBMISSION_CRITICAL_ERROR:', error);
      const errorMessage = error.message || error.details || JSON.stringify(error);
      toast({
        title: 'Submission Failed',
        description: `Error: ${errorMessage}. Please check your connection and try again.`,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (hasApplied) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-primary/10 p-3 mb-4">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <DialogTitle className="text-xl mb-2">Application Submitted!</DialogTitle>
            <DialogDescription>
              Your application for {job.title} at {job.company} has been sent successfully.
            </DialogDescription>
            <Button className="mt-6" onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl scrollbar-hide max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle className="text-2xl">Apply for {job.title}</DialogTitle>
              <DialogDescription className="text-lg">at {job.company}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {step === 'upload' ? (
          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <Label className="text-base font-semibold">Step 1: Upload Resume & LinkedIn</Label>
              <div
                className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${resumeFile ? 'border-primary bg-primary/10 shadow-inner' : 'border-muted-foreground/20 hover:border-primary/50 bg-muted/30'
                  }`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0];
                  if (file) setResumeFile(file);
                }}
              >
                <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.txt" onChange={handleFileChange} className="hidden" />
                {resumeFile ? (
                  <div className="space-y-3">
                    <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                      <FileText className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-primary text-lg">{resumeFile.name}</p>
                      <p className="text-sm text-muted-foreground">Ready for AI analysis</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setResumeFile(null); }} className="mt-2 text-destructive border-destructive/20 hover:bg-destructive/10">
                      <X className="h-4 w-4 mr-1" /> Change File
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto transition-colors">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold">Drop Resume or Click to Upload</p>
                      <p className="text-sm text-muted-foreground px-4">AI Scan supports PDF, DOCX, and TXT (Max 5MB)</p>
                    </div>
                    <div className="flex justify-center gap-2">
                      <span className="text-[10px] px-2 py-1 bg-muted rounded border uppercase font-bold text-muted-foreground">PDF</span>
                      <span className="text-[10px] px-2 py-1 bg-muted rounded border uppercase font-bold text-muted-foreground">DOCX</span>
                      <span className="text-[10px] px-2 py-1 bg-muted rounded border uppercase font-bold text-muted-foreground">TXT</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3 pt-2">
                <Label htmlFor="linkedin" className="flex items-center gap-2 font-semibold">
                  <Linkedin className="h-4 w-4 text-[#0077b5]" />
                  LinkedIn Profile URL (Optional)
                </Label>
                <Input
                  id="linkedin"
                  placeholder="https://linkedin.com/in/yourprofile"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  className="h-12"
                />
              </div>

              <div className="flex items-start gap-3 p-4 bg-muted/40 rounded-xl border border-muted-foreground/10">
                <input
                  type="checkbox"
                  id="consent"
                  checked={consentChecked}
                  onChange={(e) => setConsentChecked(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Label htmlFor="consent" className="text-xs text-muted-foreground leading-relaxed cursor-pointer font-medium">
                  I consent to using AI to analyze my resume and LinkedIn details.
                  My data is processed temporarily only for this application.
                </Label>
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-4">
              <Button
                onClick={handleAutofill}
                disabled={!resumeFile || !consentChecked || autofilling}
                className="w-full h-14 text-lg font-bold bg-primary hover:opacity-95 shadow-lg shadow-primary/20"
              >
                {autofilling ? (
                  <>
                    <Loader2 className="h-6 w-6 mr-3 animate-spin" />
                    Analyzing your resume using AI…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-6 w-6 mr-3 text-yellow-300 animate-pulse" />
                    Autofill using AI ✨
                  </>
                )}
              </Button>
              <Button variant="ghost" onClick={() => setStep('form')} className="h-12 text-muted-foreground hover:text-foreground">
                I'll fill the form manually
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="font-semibold text-sm">Full name</Label>
                <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Enter your full name" className="h-11" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="font-semibold text-sm">Working email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" className="h-11" />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="phone" className="font-semibold text-sm">Phone number</Label>
                <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 234 567 890" className="h-11" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location" className="font-semibold text-sm">Location</Label>
                <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, Country" className="h-11" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="headline" className="font-semibold text-sm">Current Role / Professional Headline</Label>
              <Input id="headline" value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="e.g. Senior Software Engineer" className="h-11" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cover" className="font-semibold text-sm">Professional Summary / About</Label>
              <Textarea
                id="cover"
                placeholder="Briefly describe your professional background..."
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                rows={5}
                className="resize-none"
              />
            </div>

            <div className="flex flex-col gap-4 p-4 bg-muted/40 rounded-xl border border-muted-foreground/10">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Resume Document</h4>
                {!resumeFile && <span className="text-[10px] bg-destructive/10 text-destructive px-2 py-0.5 rounded font-bold">REQUIRED</span>}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 ${resumeFile ? 'bg-primary/10' : 'bg-muted'} rounded flex items-center justify-center`}>
                    <FileText className={`h-6 w-6 ${resumeFile ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div>
                    {resumeFile ? (
                      <>
                        <p className="text-sm font-semibold truncate max-w-[300px]">{resumeFile.name}</p>
                        <p className="text-xs text-muted-foreground italic">Attached to application</p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-semibold text-muted-foreground">No resume uploaded</p>
                        <p className="text-xs text-destructive italic">Required for submission</p>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className={resumeFile ? "text-muted-foreground hover:text-destructive" : "bg-primary text-primary-foreground hover:bg-primary/90"}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {resumeFile ? 'Replace' : 'Upload Resume'}
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex gap-4 justify-end pt-4 border-t">
              <Button variant="outline" onClick={() => setStep('upload')} className="h-12 px-8">Back</Button>
              <Button onClick={handleSubmit} disabled={loading} className="h-12 px-12 text-lg font-bold shadow-soft">
                {loading ? <Loader2 className="h-5 w-5 mr-3 animate-spin" /> : 'Confirm & Send Application'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

