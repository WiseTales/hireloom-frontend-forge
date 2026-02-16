import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { JobPostForm } from '@/components/recruiter/JobPostForm';
import { JobList } from '@/components/recruiter/JobList';
import { ApplicantsList } from '@/components/recruiter/ApplicantsList';
import { PipelineKanban } from '@/components/recruiter/pipeline/PipelineKanban';
import { Users, LayoutGrid, PlusCircle } from 'lucide-react';

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
    visibility: 'external',
    is_published: true
  });

  const fetchJobs = useCallback(async () => {
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
  }, [user, toast]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);

    const companySlug = formData.company.toLowerCase().replace(/\s+/g, "-");

    if (editingJob) {
      const { error } = await supabase
        .from('jobs')
        .update({
          title: formData.title,
          company: formData.company,
          company_slug: companySlug,
          status: "published",
          description: formData.description,
          location: formData.location,
          salary: formData.salary,
          type: formData.type,
          category: formData.category,
          employee_range: formData.employee_range,
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
      const { error } = await supabase
        .from('jobs')
        .insert([{
          ...formData,
          company_slug: companySlug,
          status: "published",
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
            <TabsTrigger value="post" className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              Post Job
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              My Jobs ({jobs.length})
            </TabsTrigger>
            <TabsTrigger value="pipeline" className="flex items-center gap-2">
              <LayoutGrid className="h-4 w-4" />
              Pipeline
            </TabsTrigger>
            <TabsTrigger value="applicants" className="relative flex items-center gap-2">
              Applicants
              <Users className="h-4 w-4" />
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pipeline" className="h-[calc(100vh-200px)]">
            <PipelineKanban />
          </TabsContent>

          <TabsContent value="post">
            <JobPostForm
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleSubmit}
              submitting={submitting}
              editingJob={editingJob}
              onCancelEdit={resetForm}
            />
          </TabsContent>

          <TabsContent value="history">
            <JobList
              jobs={jobs}
              loading={loading}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onTogglePublish={togglePublishJob}
            />
          </TabsContent>

          <TabsContent value="applicants">
            <ApplicantsList />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default RecruiterDashboard;
