import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Plus, Trash2, FolderGit2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Project {
  id: string;
  title: string;
  description: string;
  url: string | null;
  image_url: string | null;
  start_date: string;
  end_date: string | null;
  technologies: string[] | null;
}

interface ProjectsProps {
  profileId: string;
  isOwnProfile: boolean;
}

export const Projects = ({ profileId, isOwnProfile }: ProjectsProps) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    url: '',
    image_url: '',
    start_date: '',
    end_date: '',
    technologies: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchProjects();
  }, [profileId]);

  const fetchProjects = async () => {
    const { data } = await supabase
      .from('projects')
      .select('*')
      .eq('profile_id', profileId)
      .order('start_date', { ascending: false });

    if (data) setProjects(data);
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.description || !formData.start_date) {
      toast({
        title: 'Required fields missing',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    const technologies = formData.technologies
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const { error } = await supabase.from('projects').insert({
      profile_id: profileId,
      title: formData.title,
      description: formData.description,
      url: formData.url || null,
      image_url: formData.image_url || null,
      start_date: formData.start_date,
      end_date: formData.end_date || null,
      technologies,
    });

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Project added successfully' });
      setFormData({
        title: '',
        description: '',
        url: '',
        image_url: '',
        start_date: '',
        end_date: '',
        technologies: '',
      });
      setOpen(false);
      fetchProjects();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('projects').delete().eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Project removed' });
      fetchProjects();
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <FolderGit2 className="h-5 w-5" />
            Projects
          </h3>
          {isOwnProfile && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add Project</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                  <Input
                    placeholder="Project Title *"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                  <Textarea
                    placeholder="Project Description *"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                  />
                  <Input
                    placeholder="Project URL"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  />
                  <Input
                    placeholder="Image URL"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-muted-foreground">Start Date *</label>
                      <Input
                        type="date"
                        value={formData.start_date}
                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">End Date</label>
                      <Input
                        type="date"
                        value={formData.end_date}
                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      />
                    </div>
                  </div>
                  <Input
                    placeholder="Technologies (comma-separated, e.g., React, Node.js, PostgreSQL)"
                    value={formData.technologies}
                    onChange={(e) => setFormData({ ...formData, technologies: e.target.value })}
                  />
                  <Button onClick={handleSubmit} className="w-full">
                    Add Project
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {projects.length === 0 ? (
          <p className="text-muted-foreground">No projects added yet</p>
        ) : (
          <div className="space-y-6">
            {projects.map((project) => (
              <div key={project.id} className="border-b pb-6 last:border-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    {project.image_url && (
                      <img
                        src={project.image_url}
                        alt={project.title}
                        className="w-full h-48 object-cover rounded-lg mb-3"
                      />
                    )}
                    <h4 className="font-medium text-lg">{project.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {new Date(project.start_date).toLocaleDateString()} -{' '}
                      {project.end_date
                        ? new Date(project.end_date).toLocaleDateString()
                        : 'Present'}
                    </p>
                    <p className="text-sm mt-2">{project.description}</p>
                    {project.technologies && project.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {project.technologies.map((tech, idx) => (
                          <Badge key={idx} variant="outline">
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {project.url && (
                      <a
                        href={project.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary flex items-center gap-1 mt-2 hover:underline"
                      >
                        View Project <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                  {isOwnProfile && (
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(project.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
