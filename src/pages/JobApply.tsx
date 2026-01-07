import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Upload, FileText, Check, Briefcase, MapPin, Building2 } from 'lucide-react';
import { toast } from 'sonner';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  category: string;
  type: string;
  location_type: string | null;
  work_type: string | null;
  description: string;
}

const JobApply = () => {
  const { id } = useParams<{ id: string }>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  // Form fields
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [currentLocation, setCurrentLocation] = useState('');
  const [currentCompany, setCurrentCompany] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [otherWebsite, setOtherWebsite] = useState('');
  const [eligibilityToWork, setEligibilityToWork] = useState<string>('');
  const [coverLetter, setCoverLetter] = useState('');
  const [consentToContact, setConsentToContact] = useState(false);

  useEffect(() => {
    if (id) {
      fetchJob();
    }
  }, [id]);

  const fetchJob = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('id, title, company, location, category, type, location_type, work_type, description')
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please upload a PDF, DOC, or DOCX file');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      setResumeFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fullName || !email || !phone || !resumeFile || !eligibilityToWork) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (eligibilityToWork === 'no') {
      toast.error('You must have authorization to work in the job location');
      return;
    }

    setSubmitting(true);
    try {
      // Upload resume to storage
      const fileExt = resumeFile.name.split('.').pop();
      const fileName = `${id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(fileName, resumeFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('resumes')
        .getPublicUrl(fileName);

      // Submit application
      const { error: applicationError } = await supabase
        .from('public_applications')
        .insert({
          job_id: id,
          full_name: fullName,
          email: email,
          resume_url: urlData.publicUrl,
          phone: phone,
          current_location: currentLocation,
          current_company: currentCompany,
          linkedin_url: linkedinUrl,
          github_url: githubUrl,
          portfolio_url: portfolioUrl,
          other_website: otherWebsite,
          eligibility_to_work: eligibilityToWork === 'yes',
          cover_letter: coverLetter,
          consent_to_contact: consentToContact,
        });

      if (applicationError) throw applicationError;

      setSubmitted(true);
      toast.success('Application submitted successfully!');
    } catch (error: any) {
      console.error('Error submitting application:', error);
      toast.error(error.message || 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <h1 className="text-2xl font-semibold mb-4">Job not found</h1>
        <Link to="/">
          <Button>Back to Jobs</Button>
        </Link>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-6 flex justify-center">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">HL</span>
              </div>
              <span className="font-semibold text-foreground">HireLoom</span>
            </Link>
          </div>
        </header>
        
        <div className="container mx-auto px-4 py-16 max-w-lg text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-fade-in">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold mb-4 animate-fade-in stagger-1">Application Submitted!</h1>
          <p className="text-muted-foreground mb-8 animate-fade-in stagger-2">
            Thank you for applying for <strong>{job.title}</strong> at {job.company}. 
            We'll review your application and get back to you soon.
          </p>
          <Link to="/">
            <Button variant="outline" className="animate-fade-in stagger-3">Browse More Jobs</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 py-6 flex justify-center">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
              <span className="text-primary font-bold text-sm">HL</span>
            </div>
            <span className="font-semibold text-lg">HireLoom</span>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Back link */}
        <Link 
          to={`/jobs/${id}`} 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to job details
        </Link>

        {/* Job Info Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold text-foreground mb-3">{job.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {job.location}
            </span>
            <span className="flex items-center gap-1">
              <Building2 className="h-4 w-4" />
              {job.company}
            </span>
            <span className="flex items-center gap-1">
              <Briefcase className="h-4 w-4" />
              {job.category} / {job.work_type || job.type} / {job.location_type || 'On-site'}
            </span>
          </div>
        </div>

        {/* Application Form */}
        <Card className="shadow-lg animate-fade-in stagger-1">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Section: Submit Your Application */}
              <div>
                <h2 className="text-lg font-semibold mb-6 uppercase tracking-wide text-primary">
                  Submit Your Application
                </h2>

                {/* Resume Upload */}
                <div className="mb-6">
                  <Label htmlFor="resume" className="flex items-center gap-1 mb-2">
                    Resume/CV <span className="text-destructive">*</span>
                  </Label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    id="resume"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-12 justify-start gap-2 border-2 border-dashed hover:border-primary transition-colors"
                  >
                    <Upload className="h-4 w-4" />
                    {resumeFile ? resumeFile.name : 'ATTACH RESUME/CV'}
                  </Button>
                  {resumeFile && (
                    <div className="flex items-center gap-2 mt-2 text-sm text-green-600">
                      <FileText className="h-4 w-4" />
                      {resumeFile.name}
                    </div>
                  )}
                </div>

                {/* Full Name & Email */}
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <Label htmlFor="fullName" className="flex items-center gap-1">
                      Full name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="mt-2 h-12"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="flex items-center gap-1">
                      Email <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-2 h-12"
                      required
                    />
                  </div>
                </div>

                {/* Phone & Location */}
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <Label htmlFor="phone" className="flex items-center gap-1">
                      Phone <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="mt-2 h-12"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="currentLocation">Current location</Label>
                    <Input
                      id="currentLocation"
                      type="text"
                      value={currentLocation}
                      onChange={(e) => setCurrentLocation(e.target.value)}
                      className="mt-2 h-12"
                      placeholder="e.g. New York, NY"
                    />
                  </div>
                </div>

                {/* Current Company */}
                <div className="mb-6">
                  <Label htmlFor="currentCompany">Current company</Label>
                  <Input
                    id="currentCompany"
                    type="text"
                    value={currentCompany}
                    onChange={(e) => setCurrentCompany(e.target.value)}
                    className="mt-2 h-12"
                  />
                </div>
              </div>

              <Separator />

              {/* Section: Links */}
              <div>
                <h2 className="text-lg font-semibold mb-6 uppercase tracking-wide text-primary">
                  Links
                </h2>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="linkedin">LinkedIn URL</Label>
                    <Input
                      id="linkedin"
                      type="url"
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      className="mt-2 h-12"
                      placeholder="https://linkedin.com/in/..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="github">GitHub URL</Label>
                    <Input
                      id="github"
                      type="url"
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      className="mt-2 h-12"
                      placeholder="https://github.com/..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="portfolio">Portfolio URL</Label>
                    <Input
                      id="portfolio"
                      type="url"
                      value={portfolioUrl}
                      onChange={(e) => setPortfolioUrl(e.target.value)}
                      className="mt-2 h-12"
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="otherWebsite">Other website</Label>
                    <Input
                      id="otherWebsite"
                      type="url"
                      value={otherWebsite}
                      onChange={(e) => setOtherWebsite(e.target.value)}
                      className="mt-2 h-12"
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Section: Eligibility */}
              <div>
                <h2 className="text-lg font-semibold mb-4 uppercase tracking-wide text-primary">
                  Eligibility to Work
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Applicants must have authorization to work in the jurisdiction where the position is posted, 
                  without requiring employer sponsorship. By submitting this application, you are affirming that 
                  you have or reasonably expect to have such work authorization by the expected start date.
                  <span className="text-destructive"> *</span>
                </p>
                <RadioGroup value={eligibilityToWork} onValueChange={setEligibilityToWork} className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="yes" id="eligibility-yes" />
                    <Label htmlFor="eligibility-yes" className="font-normal cursor-pointer">
                      Yes – I confirm I meet the above requirement
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="no" id="eligibility-no" />
                    <Label htmlFor="eligibility-no" className="font-normal cursor-pointer">
                      No – I do not meet the above requirement
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <Separator />

              {/* Cover Letter */}
              <div>
                <Label htmlFor="coverLetter">Cover letter or anything else you want to share</Label>
                <Textarea
                  id="coverLetter"
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  className="mt-2 min-h-[150px]"
                  placeholder="Add a cover letter or anything else you want to share..."
                />
              </div>

              <Separator />

              {/* Consent Checkbox */}
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="consent"
                  checked={consentToContact}
                  onCheckedChange={(checked) => setConsentToContact(checked as boolean)}
                />
                <Label htmlFor="consent" className="text-sm font-normal cursor-pointer leading-relaxed">
                  Yes, {job.company} can contact me about future job opportunities for up to 1 year
                </Label>
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full h-14 text-lg font-semibold"
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'SUBMIT APPLICATION'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default JobApply;
