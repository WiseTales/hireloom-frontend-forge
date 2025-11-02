import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Bell, Plus, Trash2, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface JobAlert {
  id: string;
  keywords: string[];
  location: string | null;
  job_type: string | null;
  experience_level: string | null;
  is_remote: boolean | null;
  created_at: string;
}

export const JobAlerts = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<JobAlert[]>([]);
  const [open, setOpen] = useState(false);
  const [keywordInput, setKeywordInput] = useState('');
  const [formData, setFormData] = useState({
    keywords: [] as string[],
    location: '',
    job_type: '',
    experience_level: '',
    is_remote: false,
  });

  useEffect(() => {
    if (user) fetchAlerts();
  }, [user]);

  const fetchAlerts = async () => {
    const { data } = await supabase
      .from('job_alerts')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });

    if (data) setAlerts(data);
  };

  const addKeyword = () => {
    if (keywordInput.trim() && !formData.keywords.includes(keywordInput.trim())) {
      setFormData({
        ...formData,
        keywords: [...formData.keywords, keywordInput.trim()],
      });
      setKeywordInput('');
    }
  };

  const removeKeyword = (keyword: string) => {
    setFormData({
      ...formData,
      keywords: formData.keywords.filter((k) => k !== keyword),
    });
  };

  const handleCreate = async () => {
    if (formData.keywords.length === 0) {
      toast({
        title: 'Keywords required',
        description: 'Please add at least one keyword',
        variant: 'destructive',
      });
      return;
    }

    const { error } = await supabase.from('job_alerts').insert({
      user_id: user?.id,
      keywords: formData.keywords,
      location: formData.location || null,
      job_type: formData.job_type || null,
      experience_level: formData.experience_level || null,
      is_remote: formData.is_remote,
    });

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Job alert created successfully' });
      setFormData({
        keywords: [],
        location: '',
        job_type: '',
        experience_level: '',
        is_remote: false,
      });
      setOpen(false);
      fetchAlerts();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('job_alerts').delete().eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Job alert deleted' });
      fetchAlerts();
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Job Alerts</h3>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Create Alert
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Job Alert</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Keywords (required)</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      placeholder="e.g., React Developer"
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
                    />
                    <Button onClick={addKeyword} size="sm">
                      Add
                    </Button>
                  </div>
                  {formData.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.keywords.map((keyword) => (
                        <Badge key={keyword} variant="secondary">
                          {keyword}
                          <button onClick={() => removeKeyword(keyword)} className="ml-1">
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <Label>Location</Label>
                  <Input
                    placeholder="City, State, or Country"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Job Type</Label>
                  <Select
                    value={formData.job_type}
                    onValueChange={(value) => setFormData({ ...formData, job_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full-time">Full Time</SelectItem>
                      <SelectItem value="part-time">Part Time</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="freelance">Freelance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Experience Level</Label>
                  <Select
                    value={formData.experience_level}
                    onValueChange={(value) =>
                      setFormData({ ...formData, experience_level: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entry">Entry Level</SelectItem>
                      <SelectItem value="mid">Mid Level</SelectItem>
                      <SelectItem value="senior">Senior Level</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="alert-remote"
                    checked={formData.is_remote}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_remote: !!checked })
                    }
                  />
                  <Label htmlFor="alert-remote" className="cursor-pointer">
                    Remote Only
                  </Label>
                </div>

                <Button onClick={handleCreate} className="w-full">
                  Create Alert
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {alerts.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            No job alerts yet. Create one to get notified about matching jobs.
          </p>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="border rounded-lg p-4 flex items-start justify-between"
              >
                <div className="flex-1">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {alert.keywords.map((keyword) => (
                      <Badge key={keyword}>{keyword}</Badge>
                    ))}
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    {alert.location && <p>Location: {alert.location}</p>}
                    {alert.job_type && <p>Type: {alert.job_type}</p>}
                    {alert.experience_level && <p>Level: {alert.experience_level}</p>}
                    {alert.is_remote && <p>Remote Only</p>}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(alert.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
