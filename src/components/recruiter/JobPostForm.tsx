import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Loader2, Link, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface JobFormData {
  title: string;
  company: string;
  description: string;
  location: string;
  salary: string;
  type: string;
  category: string;
  employee_range: string;
  visibility: string;
  is_published: boolean;
}

interface JobPostFormProps {
  formData: JobFormData;
  setFormData: (data: JobFormData) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  submitting: boolean;
  editingJob: { id: string } | null;
  onCancelEdit: () => void;
}

export const JobPostForm = ({ 
  formData, 
  setFormData, 
  onSubmit, 
  submitting, 
  editingJob, 
  onCancelEdit 
}: JobPostFormProps) => {
  const { toast } = useToast();
  const [jobUrl, setJobUrl] = useState('');
  const [autofilling, setAutofilling] = useState(false);
  const [autofillError, setAutofillError] = useState<string | null>(null);
  const [autofilledFields, setAutofilledFields] = useState<Set<string>>(new Set());

  const handleAutofill = async () => {
    if (!jobUrl.trim()) {
      toast({
        title: 'URL Required',
        description: 'Please enter a job posting URL to autofill',
        variant: 'destructive'
      });
      return;
    }

    setAutofilling(true);
    setAutofillError(null);
    setAutofilledFields(new Set());

    try {
      const { data, error } = await supabase.functions.invoke('job-autofill', {
        body: { url: jobUrl.trim() }
      });

      if (error) {
        throw new Error(error.message || 'Failed to extract job data');
      }

      if (!data?.success || !data?.data) {
        throw new Error(data?.error || 'No job data extracted');
      }

      const extracted = data.data;
      const filledFields = new Set<string>();

      // Map extracted data to form fields
      const newFormData = { ...formData };

      if (extracted.job_title) {
        newFormData.title = extracted.job_title;
        filledFields.add('title');
      }
      if (extracted.company_name) {
        newFormData.company = extracted.company_name;
        filledFields.add('company');
      }
      if (extracted.location) {
        newFormData.location = extracted.location;
        filledFields.add('location');
      }
      if (extracted.salary) {
        newFormData.salary = extracted.salary;
        filledFields.add('salary');
      }

      // Build comprehensive description
      let description = '';
      if (extracted.job_description) {
        description += extracted.job_description + '\n\n';
      }
      if (extracted.responsibilities?.length) {
        description += 'Responsibilities:\n' + extracted.responsibilities.map((r: string) => `• ${r}`).join('\n') + '\n\n';
      }
      if (extracted.required_skills?.length) {
        description += 'Required Skills:\n' + extracted.required_skills.map((s: string) => `• ${s}`).join('\n') + '\n\n';
      }
      if (extracted.experience_level) {
        description += `Experience: ${extracted.experience_level}\n`;
      }
      if (extracted.education_requirements) {
        description += `Education: ${extracted.education_requirements}\n`;
      }
      
      if (description.trim()) {
        newFormData.description = description.trim();
        filledFields.add('description');
      }

      // Map employment type
      if (extracted.employment_type) {
        const typeMap: Record<string, string> = {
          'full-time': 'Full-time',
          'fulltime': 'Full-time',
          'full time': 'Full-time',
          'part-time': 'Part-time',
          'parttime': 'Part-time',
          'part time': 'Part-time',
          'contract': 'Contract',
          'contractor': 'Contract',
          'internship': 'Internship',
          'intern': 'Internship'
        };
        const normalizedType = extracted.employment_type.toLowerCase();
        const mappedType = typeMap[normalizedType] || 
          Object.entries(typeMap).find(([key]) => normalizedType.includes(key))?.[1];
        if (mappedType) {
          newFormData.type = mappedType;
          filledFields.add('type');
        }
      }

      setFormData(newFormData);
      setAutofilledFields(filledFields);

      toast({
        title: 'Autofill Complete ✨',
        description: `Successfully extracted ${filledFields.size} fields from the job posting`
      });

    } catch (err) {
      console.error('Autofill error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to extract job data';
      setAutofillError(errorMessage);
      toast({
        title: 'Autofill Failed',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setAutofilling(false);
    }
  };

  const getFieldClassName = (fieldName: string) => {
    return autofilledFields.has(fieldName) 
      ? 'ring-2 ring-primary/30 bg-primary/5 transition-all duration-300' 
      : '';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{editingJob ? 'Edit Job' : 'Post a New Job'}</CardTitle>
        <CardDescription>
          {editingJob 
            ? 'Update the job details below' 
            : 'Paste a job posting URL to auto-extract details, or fill in manually'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* AI Autofill Section */}
        {!editingJob && (
          <div className="mb-8 p-4 border border-dashed border-primary/30 rounded-lg bg-primary/5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Quick Autofill with AI</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Paste your existing job posting URL and we'll automatically extract all the details.
            </p>
            
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="url"
                  placeholder="https://yourcompany.com/careers/job-posting"
                  value={jobUrl}
                  onChange={(e) => setJobUrl(e.target.value)}
                  className="pl-10"
                  disabled={autofilling}
                />
              </div>
              <Button 
                type="button"
                onClick={handleAutofill}
                disabled={autofilling || !jobUrl.trim()}
                className="gap-2"
              >
                {autofilling ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Autofill using AI ✨
                  </>
                )}
              </Button>
            </div>

            {autofillError && (
              <div className="mt-3 p-3 bg-destructive/10 border border-destructive/30 rounded-md flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                <p className="text-sm text-destructive">{autofillError}</p>
              </div>
            )}

            {autofilledFields.size > 0 && (
              <p className="mt-3 text-sm text-primary">
                ✓ Auto-filled {autofilledFields.size} field(s). Review and edit as needed below.
              </p>
            )}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="title">Job Title *</Label>
              <Input
                id="title"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Senior Software Engineer"
                className={getFieldClassName('title')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Company Name *</Label>
              <Input
                id="company"
                required
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="e.g. Tech Corp"
                className={getFieldClassName('company')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g. New York, NY or Remote"
                className={getFieldClassName('location')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="salary">Salary Range</Label>
              <Input
                id="salary"
                value={formData.salary}
                onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                placeholder="e.g. $80k - $120k"
                className={getFieldClassName('salary')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Job Type *</Label>
              <Select 
                value={formData.type} 
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger className={getFieldClassName('type')}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Full-time">Full-time</SelectItem>
                  <SelectItem value="Part-time">Part-time</SelectItem>
                  <SelectItem value="Contract">Contract</SelectItem>
                  <SelectItem value="Internship">Internship</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IT/Tech">IT/Tech</SelectItem>
                  <SelectItem value="Sales/Marketing">Sales/Marketing</SelectItem>
                  <SelectItem value="Finance">Finance</SelectItem>
                  <SelectItem value="Healthcare">Healthcare</SelectItem>
                  <SelectItem value="Engineering">Engineering</SelectItem>
                  <SelectItem value="Design">Design</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="employee_range">Company Size *</Label>
              <Select 
                value={formData.employee_range} 
                onValueChange={(value) => setFormData({ ...formData, employee_range: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-10">1-10 employees</SelectItem>
                  <SelectItem value="11-50">11-50 employees</SelectItem>
                  <SelectItem value="51-200">51-200 employees</SelectItem>
                  <SelectItem value="201-500">201-500 employees</SelectItem>
                  <SelectItem value="501-1000">501-1000 employees</SelectItem>
                  <SelectItem value="1000+">1000+ employees</SelectItem>
                </SelectContent>
              </Select>
            </div>

          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Job Description *</Label>
            <Textarea
              id="description"
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the role, responsibilities, requirements..."
              rows={8}
              className={getFieldClassName('description')}
            />
          </div>

          <div className="flex gap-4">
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : editingJob ? 'Update Job' : 'Post Job'}
            </Button>
            {editingJob && (
              <Button type="button" variant="outline" onClick={onCancelEdit}>
                Cancel Edit
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
