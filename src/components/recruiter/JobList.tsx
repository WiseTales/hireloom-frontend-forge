import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit, Eye, EyeOff } from 'lucide-react';

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

interface JobListProps {
  jobs: Job[];
  loading: boolean;
  onEdit: (job: Job) => void;
  onDelete: (jobId: string) => void;
  onTogglePublish: (jobId: string, currentStatus: boolean | null) => void;
}

export const JobList = ({ jobs, loading, onEdit, onDelete, onTogglePublish }: JobListProps) => {
  if (loading) {
    return <p className="text-center py-8 text-muted-foreground">Loading jobs...</p>;
  }

  if (jobs.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center py-8 text-muted-foreground">
            You haven't posted any jobs yet. Click on the "Post Job" tab to create your first job posting.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {jobs.map((job) => (
        <Card 
          key={job.id} 
          className={`border-l-4 ${job.is_published ? 'border-l-green-500' : 'border-l-muted'}`}
        >
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {job.is_published ? (
                    <Badge className="bg-primary/10 text-primary">
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
                  onCheckedChange={() => onTogglePublish(job.id, job.is_published)}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEdit(job)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => onDelete(job.id)}
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
            
            <p className="text-xs text-muted-foreground mt-4">
              Posted: {new Date(job.created_at).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
