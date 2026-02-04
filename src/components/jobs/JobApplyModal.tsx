import { useState, useEffect, useRef } from 'react';
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
  headline: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  total_experience_years: number | null;
  summary: string | null;
}

// Simple text extraction from file (PDF/DOCX/TXT)
async function extractTextFromFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result;
        if (file.type === 'text/plain') {
          resolve(content as string);
          return;
        }
        if (content instanceof ArrayBuffer) {
          const decoder = new TextDecoder('utf-8', { fatal: false });
          let text = decoder.decode(content);

          if (file.type === 'application/pdf') {
            const textMatches = text.match(/\(([^)]+)\)/g) || [];
            const streamText = textMatches.map(m => m.slice(1, -1)).filter(t => t.length > 2).join(' ');
            const btEtMatches = text.match(/BT[\s\S]*?ET/g) || [];
            const btText = btEtMatches.join(' ').replace(/\[[^\]]*\]/g, '');
            text = (streamText + ' ' + btText).replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, ' ').replace(/\s+/g, ' ').trim();
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
  const [step, setStep] = useState<'upload' | 'form'>('upload');

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [headline, setHeadline] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [linkedinUrl, setLinkedinUrl] = useState('');

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      setHeadline(extracted.headline || headline);
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

    setLoading(true);
    try {
      let resumeUrl = null;
      if (resumeFile) {
        const fileExt = resumeFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `resumes/${fileName}`;
        const { error: uploadError } = await supabase.storage.from('resumes').upload(filePath, resumeFile);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('resumes').getPublicUrl(filePath);
        resumeUrl = publicUrl;
      }

      const applicationData = {
        job_id: job.id,
        applicant_name: fullName,
        applicant_email: email,
        cover_letter: coverLetter,
        status: 'applied',
        resume_url: resumeUrl,
        linkedin_url: linkedinUrl || null,
      };

      if (user) {
        // Authenticated application
        const { error } = await supabase.from('job_applications').insert({
          ...applicationData,
          user_id: user.id
        });
        if (error) throw error;

        await createNotification({
          userId: user.id,
          type: 'job_application',
          title: 'Application Submitted',
          message: `Your application for ${job.title} at ${job.company} has been submitted successfully.`,
          link: '/applied',
        });
      } else {
        // Guest application using public_applications table
        const { error } = await supabase.from('public_applications').insert({
          ...applicationData,
          full_name: fullName, // mapping different field names in public_applications
          email: email,
        });
        if (error) throw error;
      }

      toast({ title: 'Application Submitted! 🎉', description: `Good luck with your application for ${job.title}.` });
      setHasApplied(true);
      onSuccess?.();
      setTimeout(() => onOpenChange(false), 2000);
    } catch (error) {
      console.error('Submission error:', error);
      toast({ title: 'Error', description: 'Failed to submit application. Please try again.', variant: 'destructive' });
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
      <DialogContent className="sm:max-w-lg scrollbar-hide max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle>Apply for {job.title}</DialogTitle>
              <DialogDescription>at {job.company}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {step === 'upload' ? (
          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <Label className="text-sm font-medium">Step 1: Upload Resume & LinkedIn</Label>
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${resumeFile ? 'border-primary bg-primary/5' : 'border-muted-foreground/20 hover:border-primary/50 bg-muted/30'
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
                  <div className="space-y-2">
                    <FileText className="h-10 w-10 mx-auto text-primary" />
                    <p className="font-medium text-primary">{resumeFile.name}</p>
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setResumeFile(null); }}>
                      <X className="h-4 w-4 mr-1" /> Remove
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
                    <p className="text-sm font-medium">Drop Resume or Click to Upload</p>
                    <p className="text-xs text-muted-foreground">PDF, DOCX, or TXT (Max 5MB)</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="linkedin" className="flex items-center gap-2">
                  <Linkedin className="h-4 w-4 text-[#0077b5]" />
                  LinkedIn Profile URL (Optional)
                </Label>
                <Input
                  id="linkedin"
                  placeholder="https://linkedin.com/in/username"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button onClick={handleAutofill} disabled={!resumeFile || autofilling} className="w-full bg-gradient-to-r from-primary to-purple-600 hover:opacity-90">
                {autofilling ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                Autofill using AI ✨
              </Button>
              <Button variant="ghost" onClick={() => setStep('form')} className="w-full text-muted-foreground">
                Apply manually without AI
              </Button>
            </div>
            <p className="text-[10px] text-center text-muted-foreground">
              🔒 No signup required. Your data is used only for this application.
            </p>
          </div>
        ) : (
          <div className="space-y-5 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Zuhair Arif" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="zuhair@example.com" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="headline">Professional Headline</Label>
              <Input id="headline" value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="Full Stack Developer" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cover">Cover Letter / About (Optional)</Label>
              <Textarea
                id="cover"
                placeholder="Tell the employer why you're a great fit..."
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                rows={4}
              />
            </div>

            {resumeFile && (
              <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="text-xs font-medium truncate max-w-[200px]">{resumeFile.name}</span>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setResumeFile(null); setStep('upload'); }}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}

            <div className="flex gap-3 justify-end pt-2">
              <Button variant="outline" onClick={() => setStep('upload')}>Back</Button>
              <Button onClick={handleSubmit} disabled={loading} className="px-8">
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : 'Confirm & Apply'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

