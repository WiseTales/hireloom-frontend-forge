import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Edit, Eye, EyeOff, ExternalLink } from 'lucide-react';

interface Job {
  id: string;
  title: string;
  company: string;
  description: string;
  location: string;
  salary: string;
  type: string;
  category: string;
  employee_range: string;
  application_url: string | null;
  created_at: string;
  is_published: boolean | null;
  visibility: string | null;
}

const RecruiterDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    company: '',
    description: '',
    location: '',
    salary: '',
    type: 'Full-time',
    category: 'IT/Tech',
    employee_range: '1-10',
    application_url: '',
    visibility: 'external',
    is_published: true
  });

  useEffect(() => {
    fetchJobs();
  }, [user]);

  const fetchJobs = async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('posted_by', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch your jobs',
        variant: 'destructive'
      });
    } else {
      setJobs(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.application_url) {
      toast({
        title: 'Application URL Required',
        description: 'Please provide the official careers/application page link',
        variant: 'destructive'
      });
      return;
    }

    setSubmitting(true);

    if (editingJob) {
      // Update existing job
      const { error } = await supabase
        .from('jobs')
        .update({
          title: formData.title,
          company: formData.company,
          description: formData.description,
          location: formData.location,
          salary: formData.salary,
          type: formData.type,
          category: formData.category,
          employee_range: formData.employee_range,
          application_url: formData.application_url,
          visibility: formData.visibility as 'internal' | 'external',
          is_published: formData.is_published
        })
        .eq('id', editingJob.id);

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to update job',
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Success',
          description: 'Job updated successfully'
        });
        resetForm();
        fetchJobs();
      }
    } else {
      // Create new job
      const { error } = await supabase
        .from('jobs')
        .insert([{
          ...formData,
          posted_by: user.id,
          visibility: formData.visibility as 'internal' | 'external',
          is_published: formData.is_published
        }]);

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to post job',
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Success',
          description: 'Job posted successfully'
        });
        resetForm();
        fetchJobs();
      }
    }

    setSubmitting(false);
  };

  const handleDelete = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job?')) return;

    const { error } = await supabase
      .from('jobs')
      .delete()
      .eq('id', jobId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete job',
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Success',
        description: 'Job deleted successfully'
      });
      fetchJobs();
    }
  };

  const handleEdit = (job: Job) => {
    setEditingJob(job);
    setFormData({
      title: job.title,
      company: job.company,
      description: job.description,
      location: job.location,
      salary: job.salary || '',
      type: job.type,
      category: job.category,
      employee_range: job.employee_range || '1-10',
      application_url: job.application_url || '',
      visibility: job.visibility || 'external',
      is_published: job.is_published ?? true
    });
  };

  const togglePublishJob = async (jobId: string, currentStatus: boolean | null) => {
    const { error } = await supabase
      .from('jobs')
      .update({ is_published: !currentStatus })
      .eq('id', jobId);

    if (!error) {
      fetchJobs();
      toast({
        title: 'Success',
        description: `Job ${!currentStatus ? 'published' : 'unpublished'} successfully`
      });
    }
  };

  const resetForm = () => {
    setEditingJob(null);
    setFormData({
      title: '',
      company: '',
      description: '',
      location: '',
      salary: '',
      type: 'Full-time',
      category: 'IT/Tech',
      employee_range: '1-10',
      application_url: '',
      visibility: 'external',
      is_published: true
    });
  };

  return (
    <div className="min-h-screen gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-8">Recruiter Dashboard</h1>

        <Tabs defaultValue="post" className="space-y-6">
          <TabsList>
            <TabsTrigger value="post">Post Job</TabsTrigger>
            <TabsTrigger value="history">My Jobs ({jobs.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="post">
            <Card>
              <CardHeader>
                <CardTitle>{editingJob ? 'Edit Job' : 'Post a New Job'}</CardTitle>
                <CardDescription>
                  {editingJob ? 'Update the job details below' : 'Fill in the details to post a new job opening'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="title">Job Title *</Label>
                      <Input
                        id="title"
                        required
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="e.g. Senior Software Engineer"
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
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location">Location *</Label>
                      <Input
                        id="location"
                        required
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="e.g. New York, NY"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="salary">Salary Range</Label>
                      <Input
                        id="salary"
                        value={formData.salary}
                        onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                        placeholder="e.g. $80k - $120k"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="type">Job Type *</Label>
                      <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                        <SelectTrigger>
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
                      <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
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
                      <Select value={formData.employee_range} onValueChange={(value) => setFormData({ ...formData, employee_range: value })}>
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

                    <div className="space-y-2">
                      <Label htmlFor="application_url">Application Page URL *</Label>
                      <Input
                        id="application_url"
                        type="url"
                        required
                        value={formData.application_url}
                        onChange={(e) => setFormData({ ...formData, application_url: e.target.value })}
                        placeholder="https://yourcompany.com/careers/apply"
                      />
                      <p className="text-xs text-muted-foreground">
                        Applicants will be redirected to this URL to apply
                      </p>
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
                      rows={6}
                    />
                  </div>

                  <div className="flex gap-4">
                    <Button type="submit" disabled={submitting}>
                      {submitting ? 'Saving...' : editingJob ? 'Update Job' : 'Post Job'}
                    </Button>
                    {editingJob && (
                      <Button type="button" variant="outline" onClick={resetForm}>
                        Cancel Edit
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <div className="space-y-4">
              {loading ? (
                <p className="text-center py-8 text-muted-foreground">Loading jobs...</p>
              ) : jobs.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-center py-8 text-muted-foreground">
                      You haven't posted any jobs yet. Click on the "Post Job" tab to create your first job posting.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                jobs.map((job) => (
                  <Card key={job.id} className={`border-l-4 ${job.is_published ? 'border-l-green-500' : 'border-l-muted'}`}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            {job.is_published ? (
                              <Badge className="bg-green-100 text-green-700">
                                <Eye className="h-3 w-3 mr-1" />
                                Published
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                <EyeOff className="h-3 w-3 mr-1" />
                                Draft
                              </Badge>
                            )}
                          </div>
                          <CardTitle>{job.title}</CardTitle>
                          <CardDescription>
                            {job.company} • {job.location} • {job.type}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch 
                            checked={job.is_published || false}
                            onCheckedChange={() => togglePublishJob(job.id, job.is_published)}
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(job)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(job.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-2">
                        {job.salary && `Salary: ${job.salary} • `}
                        Category: {job.category}
                        {job.employee_range && ` • Company Size: ${job.employee_range}`}
                      </p>
                      <p className="text-sm line-clamp-3">{job.description}</p>
                      
                      {job.application_url && (
                        <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                          <ExternalLink className="h-4 w-4" />
                          <a 
                            href={job.application_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="hover:underline truncate max-w-md"
                          >
                            {job.application_url}
                          </a>
                        </div>
                      )}
                      
                      <p className="text-xs text-muted-foreground mt-4">
                        Posted: {new Date(job.created_at).toLocaleDateString()}
                      </p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default RecruiterDashboard;
