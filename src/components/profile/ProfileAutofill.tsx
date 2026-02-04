import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sparkles, Upload, Linkedin, FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ExtractedProfile {
  full_name: string | null;
  professional_headline: string | null;
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

interface ProfileAutofillProps {
  profileId: string;
  onDataExtracted: (data: ExtractedProfile) => void;
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
          const decoder = new TextDecoder('utf-8', { fatal: false });
          let text = decoder.decode(content);

          if (file.type === 'application/pdf') {
            const textParts: string[] = [];
            const matches = text.match(/\(([^)]+)\)/g);
            if (matches) {
              matches.forEach(m => {
                const inner = m.slice(1, -1).trim();
                if (inner.length > 1) textParts.push(inner);
              });
            }
            const btEtBlocks = text.match(/BT[\s\S]*?ET/g);
            if (btEtBlocks) {
              btEtBlocks.forEach(block => {
                const cleaned = block.replace(/\[[^\]]*\]/g, ' ').replace(/\([^)]*\)/g, (match) => match.slice(1, -1));
                textParts.push(cleaned);
              });
            }
            text = textParts.join(' ').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, ' ').replace(/\s+/g, ' ').trim();
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

export const ProfileAutofill = ({ profileId, onDataExtracted }: ProfileAutofillProps) => {
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedProfile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File too large. Maximum size is 5MB.');
        return;
      }
      setResumeFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File too large. Maximum size is 5MB.');
        return;
      }
      setResumeFile(file);
    }
  };

  const handleAutofill = async () => {
    if (!resumeFile) {
      toast.error('Please upload your resume first');
      return;
    }

    if (!consentChecked) {
      toast.error('Please provide consent for AI processing');
      return;
    }

    setIsLoading(true);

    try {
      const resumeText = await extractTextFromFile(resumeFile);

      if (resumeText.length < 50) {
        toast.error('Could not extract enough text from resume. Try a different format.');
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('profile-autofill', {
        body: {
          resumeText,
          linkedinUrl: linkedinUrl.trim() || null
        },
      });

      if (error || !data.success) {
        throw new Error(data?.error || 'AI extraction failed');
      }

      setExtractedData(data.data);
      onDataExtracted(data.data);
      toast.success('Profile auto-filled successfully. Please review before saving.');

    } catch (err) {
      console.error('Autofill error:', err);
      toast.error('AI extraction failed. Please fill the form manually.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-2 border-primary/20 bg-primary/5 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Sparkles className="h-6 w-6 text-primary animate-pulse" />
          Resume + LinkedIn AI Autofill
        </CardTitle>
        <CardDescription className="text-base text-muted-foreground/80">
          Save time by automatically populating your profile directly from your files.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            1. Upload Resume (Primary)
          </Label>
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${resumeFile
              ? 'border-primary bg-primary/10'
              : 'border-muted-foreground/20 hover:border-primary/50 bg-background/50'
              }`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              onChange={handleFileChange}
              className="hidden"
            />
            {resumeFile ? (
              <div className="space-y-2">
                <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <p className="font-semibold text-primary">{resumeFile.name}</p>
                <p className="text-xs text-muted-foreground">File ready for analysis</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center mx-auto">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">Drop PDF/DOCX or click to browse</p>
                  <p className="text-xs text-muted-foreground mt-1">Maximum size 5MB</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            2. LinkedIn (Enhance Profile)
          </Label>
          <div className="relative">
            <Linkedin className="absolute left-3 top-3 h-5 w-5 text-[#0077b5]" />
            <Input
              placeholder="https://linkedin.com/in/yourprofile"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              className="pl-10 h-11"
            />
          </div>
          <p className="text-[10px] text-muted-foreground italic px-1">
            Optional: AI will cross-reference your LinkedIn to fill missing details.
          </p>
        </div>

        <div className="flex items-start gap-3 p-4 bg-background/40 rounded-lg border">
          <input
            type="checkbox"
            id="ai-consent"
            checked={consentChecked}
            onChange={(e) => setConsentChecked(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <Label htmlFor="ai-consent" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
            I consent to using AI to analyze my resume and LinkedIn text. My data will be processed
            temporarily and used only to populate this profile.
          </Label>
        </div>

        <Button
          onClick={handleAutofill}
          disabled={!resumeFile || !consentChecked || isLoading}
          className="w-full h-14 text-lg font-bold shadow-soft group"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-6 w-6 mr-3 animate-spin" />
              Analyzing your resume using AI…
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
              Autofill profile using AI ✨
            </>
          )}
        </Button>

        {extractedData && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/20 animate-in fade-in slide-in-from-top-2">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <p className="text-sm text-green-800 dark:text-green-300 font-medium">
              Profile auto-filled successfully. Please review before saving.
            </p>
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center">
          🔒 Privacy Guaranteed: Text is deleted immediately after extraction.
        </p>
      </CardContent>
    </Card>
  );
};
