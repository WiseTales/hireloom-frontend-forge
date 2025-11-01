import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Award, ExternalLink, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Certification {
  id: string;
  name: string;
  issuing_organization: string;
  issue_date: string;
  expiry_date: string | null;
  credential_id: string | null;
  credential_url: string | null;
}

interface CertificationsProps {
  profileId: string;
  isOwnProfile: boolean;
}

export const Certifications = ({ profileId, isOwnProfile }: CertificationsProps) => {
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    issuing_organization: '',
    issue_date: '',
    expiry_date: '',
    credential_id: '',
    credential_url: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchCertifications();
  }, [profileId]);

  const fetchCertifications = async () => {
    const { data } = await supabase
      .from('certifications')
      .select('*')
      .eq('profile_id', profileId)
      .order('issue_date', { ascending: false });

    if (data) setCertifications(data);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.issuing_organization || !formData.issue_date) {
      toast({
        title: 'Required fields missing',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    const { error } = await supabase.from('certifications').insert({
      profile_id: profileId,
      ...formData,
    });

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Certification added successfully' });
      setFormData({
        name: '',
        issuing_organization: '',
        issue_date: '',
        expiry_date: '',
        credential_id: '',
        credential_url: '',
      });
      setOpen(false);
      fetchCertifications();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('certifications').delete().eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Certification removed' });
      fetchCertifications();
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Award className="h-5 w-5" />
            Certifications & Licenses
          </h3>
          {isOwnProfile && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Certification</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Certificate Name *"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                  <Input
                    placeholder="Issuing Organization *"
                    value={formData.issuing_organization}
                    onChange={(e) =>
                      setFormData({ ...formData, issuing_organization: e.target.value })
                    }
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-muted-foreground">Issue Date *</label>
                      <Input
                        type="date"
                        value={formData.issue_date}
                        onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Expiry Date</label>
                      <Input
                        type="date"
                        value={formData.expiry_date}
                        onChange={(e) =>
                          setFormData({ ...formData, expiry_date: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <Input
                    placeholder="Credential ID"
                    value={formData.credential_id}
                    onChange={(e) => setFormData({ ...formData, credential_id: e.target.value })}
                  />
                  <Input
                    placeholder="Credential URL"
                    value={formData.credential_url}
                    onChange={(e) =>
                      setFormData({ ...formData, credential_url: e.target.value })
                    }
                  />
                  <Button onClick={handleSubmit} className="w-full">
                    Add Certification
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {certifications.length === 0 ? (
          <p className="text-muted-foreground">No certifications added yet</p>
        ) : (
          <div className="space-y-4">
            {certifications.map((cert) => (
              <div key={cert.id} className="border-b pb-4 last:border-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium">{cert.name}</h4>
                    <p className="text-sm text-muted-foreground">{cert.issuing_organization}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Issued: {new Date(cert.issue_date).toLocaleDateString()}
                      {cert.expiry_date &&
                        ` • Expires: ${new Date(cert.expiry_date).toLocaleDateString()}`}
                    </p>
                    {cert.credential_id && (
                      <p className="text-xs text-muted-foreground">
                        Credential ID: {cert.credential_id}
                      </p>
                    )}
                    {cert.credential_url && (
                      <a
                        href={cert.credential_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary flex items-center gap-1 mt-1 hover:underline"
                      >
                        View Credential <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                  {isOwnProfile && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(cert.id)}
                    >
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
