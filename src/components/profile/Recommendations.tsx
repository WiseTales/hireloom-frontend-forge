import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface Recommendation {
  id: string;
  content: string;
  relationship: string;
  status: string;
  created_at: string;
  recommender: {
    id: string;
    full_name: string;
    email: string;
  };
}

interface RecommendationsProps {
  profileId: string;
  isOwnProfile: boolean;
}

export const Recommendations = ({ profileId, isOwnProfile }: RecommendationsProps) => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [pendingRecommendations, setPendingRecommendations] = useState<Recommendation[]>([]);
  const [content, setContent] = useState('');
  const [relationship, setRelationship] = useState('');
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchRecommendations();
  }, [profileId]);

  const fetchRecommendations = async () => {
    const { data } = await supabase
      .from('recommendations')
      .select(`
        *,
        recommender:profiles!recommender_id (
          id,
          full_name,
          email
        )
      `)
      .eq('recipient_id', profileId)
      .order('created_at', { ascending: false });

    if (data) {
      setRecommendations(data.filter((r: any) => r.status === 'accepted'));
      setPendingRecommendations(data.filter((r: any) => r.status === 'pending'));
    }
  };

  const handleSubmit = async () => {
    if (!content.trim() || !relationship.trim()) return;

    const { error } = await supabase
      .from('recommendations')
      .insert({
        recipient_id: profileId,
        recommender_id: user?.id,
        content: content.trim(),
        relationship: relationship.trim(),
      });

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Recommendation sent for approval' });
      setContent('');
      setRelationship('');
      setOpen(false);
      fetchRecommendations();
    }
  };

  const handleUpdateStatus = async (id: string, status: 'accepted' | 'rejected') => {
    const { error } = await supabase
      .from('recommendations')
      .update({ status })
      .eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({ title: `Recommendation ${status}` });
      fetchRecommendations();
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Recommendations</h3>
            {!isOwnProfile && (
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">Write Recommendation</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Write a Recommendation</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      placeholder="Your relationship (e.g., Manager, Colleague)"
                      value={relationship}
                      onChange={(e) => setRelationship(e.target.value)}
                    />
                    <Textarea
                      placeholder="Write your recommendation..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      rows={6}
                    />
                    <Button onClick={handleSubmit} className="w-full">
                      Submit Recommendation
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {isOwnProfile && pendingRecommendations.length > 0 && (
            <div className="mb-4 p-4 border rounded-lg bg-muted/50">
              <h4 className="font-medium mb-2">Pending Recommendations</h4>
              {pendingRecommendations.map((rec) => (
                <div key={rec.id} className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{rec.recommender.full_name}</p>
                    <p className="text-xs text-muted-foreground">{rec.relationship}</p>
                    <p className="text-sm mt-1">{rec.content}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUpdateStatus(rec.id, 'accepted')}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUpdateStatus(rec.id, 'rejected')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {recommendations.length === 0 ? (
            <p className="text-muted-foreground">No recommendations yet</p>
          ) : (
            <div className="space-y-4">
              {recommendations.map((rec) => (
                <div key={rec.id} className="border-b pb-4 last:border-0">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {rec.recommender.full_name?.[0] || rec.recommender.email[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{rec.recommender.full_name}</p>
                      <p className="text-xs text-muted-foreground">{rec.relationship}</p>
                      <p className="text-sm mt-2">{rec.content}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(rec.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
