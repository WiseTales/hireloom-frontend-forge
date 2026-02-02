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
  headline: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  total_experience_years: number | null;
  summary: string | null;
  experience: {
    role: string;
    company: string;
    location?: string;
    start_date: string | null;
    end_date: string | null;
    currently_working: boolean;
    responsibilities: string[];
  }[] | null;
  education: {
    degree: string;
    institution: string;
    field: string | null;
    start_date: string | null;
    end_date: string | null;
  }[] | null;
  skills_technical: string[] | null;
  skills_soft: string[] | null;
  certifications: {
    name: string;
    issuing_organization: string;
    issue_date: string | null;
  }[] | null;
  projects: {
    title: string;
    description: string;
    technologies: string[];
    url: string | null;
  }[] | null;
  portfolio_links: string[] | null;
  languages: string[] | null;
}

interface ProfileAutofillProps {
  profileId: string;
  onDataExtracted: (data: ExtractedProfile) => void;
}

// Simple PDF text extraction (basic approach)
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
        
        // For PDF/DOCX, we'll extract text using a simple approach
        // In production, you'd want a proper parser library
        if (typeof content === 'string') {
          // Try to extract readable text
          const text = content
            .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
          resolve(text);
        } else if (content instanceof ArrayBuffer) {
          // Convert ArrayBuffer to text, extracting readable portions
          const decoder = new TextDecoder('utf-8', { fatal: false });
          let text = decoder.decode(content);
          
          // For PDFs, try to extract text between stream markers
          if (file.type === 'application/pdf') {
            // Extract text content from PDF streams
            const textMatches = text.match(/\(([^)]+)\)/g) || [];
            const streamText = textMatches
              .map(m => m.slice(1, -1))
              .filter(t => t.length > 2 && /[a-zA-Z]/.test(t))
              .join(' ');
            
            // Also look for text in BT...ET blocks
            const btEtMatches = text.match(/BT[\s\S]*?ET/g) || [];
            const btText = btEtMatches
              .join(' ')
              .replace(/\[[^\]]*\]/g, '')
              .replace(/\d+\.?\d*\s+\d+\.?\d*\s+Td/g, '\n')
              .replace(/Tj|TJ|Tf|Tm|Tw|Tc|T\*/g, ' ')
              .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, ' ');
            
            text = (streamText + ' ' + btText)
              .replace(/\s+/g, ' ')
              .trim();
          }
          
          // Clean up the text
          text = text
            .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, ' ')
            .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
          
          resolve(text);
        } else {
          reject(new Error('Unable to read file content'));
        }
      } catch (err) {
        reject(err);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    
    if (file.type === 'text/plain') {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  });
}

export const ProfileAutofill = ({ profileId, onDataExtracted }: ProfileAutofillProps) => {
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedProfile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
      if (!validTypes.includes(file.type)) {
        toast.error('Please upload a PDF, DOC, DOCX, or TXT file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      setResumeFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
      if (!validTypes.includes(file.type)) {
        toast.error('Please upload a PDF, DOC, DOCX, or TXT file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
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

    setIsLoading(true);

    try {
      // Extract text from file
      const resumeText = await extractTextFromFile(resumeFile);
      
      if (resumeText.length < 50) {
        toast.error('Could not extract enough text from resume. Try a different format or ensure the file is not image-only.');
        setIsLoading(false);
        return;
      }

      console.log('Extracted resume text length:', resumeText.length);

      // Call the edge function
      const { data, error } = await supabase.functions.invoke('profile-autofill', {
        body: { 
          resumeText,
          linkedinUrl: linkedinUrl.trim() || null
        },
      });

      if (error) {
        console.error('Edge function error:', error);
        toast.error('Failed to process resume. Please try again.');
        return;
      }

      if (!data.success) {
        toast.error(data.error || 'Failed to extract profile data');
        return;
      }

      setExtractedData(data.data);
      onDataExtracted(data.data);
      toast.success('Profile data extracted successfully! Review and save your profile.');

    } catch (err) {
      console.error('Autofill error:', err);
      toast.error('An error occurred while processing your resume');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-2 border-dashed border-primary/30 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Profile Autofill
        </CardTitle>
        <CardDescription>
          Upload your resume and optionally add your LinkedIn URL. We'll extract your details automatically to save time.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Resume Upload */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Resume (Required)
          </Label>
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              resumeFile 
                ? 'border-green-500 bg-green-500/10' 
                : 'border-muted-foreground/25 hover:border-primary/50'
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
              <div className="flex items-center justify-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">{resumeFile.name}</span>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Drag & drop your resume here, or click to browse
                </p>
                <p className="text-xs text-muted-foreground">
                  Supports PDF, DOC, DOCX, TXT (max 5MB)
                </p>
              </div>
            )}
          </div>
        </div>

        {/* LinkedIn URL */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Linkedin className="h-4 w-4" />
            LinkedIn Profile URL (Optional)
          </Label>
          <Input
            placeholder="https://linkedin.com/in/yourprofile"
            value={linkedinUrl}
            onChange={(e) => setLinkedinUrl(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Adding your LinkedIn helps enhance your profile with additional data
          </p>
        </div>

        {/* Autofill Button */}
        <Button
          onClick={handleAutofill}
          disabled={!resumeFile || isLoading}
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Analyzing your resume with AI…
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Autofill profile using AI ✨
            </>
          )}
        </Button>

        {/* Success indicator */}
        {extractedData && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <p className="text-sm text-green-700 dark:text-green-400">
              Profile data extracted! Switch to other tabs to review and save your experience, education, and skills.
            </p>
          </div>
        )}

        {/* Privacy notice */}
        <p className="text-xs text-muted-foreground text-center">
          🔒 Your resume is processed securely and never stored permanently.
        </p>
      </CardContent>
    </Card>
  );
};
