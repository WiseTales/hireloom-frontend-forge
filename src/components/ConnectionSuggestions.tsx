import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface Profile {
  id: string;
  full_name: string;
  email: string;
  mutual_connections: number;
}

export const ConnectionSuggestions = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchSuggestions();
  }, [user]);

  const fetchSuggestions = async () => {
    // Get current user's connections
    const { data: myConnections } = await supabase
      .from('connections')
      .select('requester_id, recipient_id')
      .or(`requester_id.eq.${user?.id},recipient_id.eq.${user?.id}`)
      .eq('status', 'accepted');

    if (!myConnections) {
      setLoading(false);
      return;
    }

    const connectedUserIds = myConnections.map((conn) =>
      conn.requester_id === user?.id ? conn.recipient_id : conn.requester_id
    );

    // Get second-degree connections
    const { data: secondDegreeConnections } = await supabase
      .from('connections')
      .select('requester_id, recipient_id')
      .or(
        connectedUserIds.map((id) => `requester_id.eq.${id},recipient_id.eq.${id}`).join(',')
      )
      .eq('status', 'accepted');

    if (!secondDegreeConnections) {
      setLoading(false);
      return;
    }

    // Count mutual connections for each suggested user
    const suggestionMap = new Map<string, number>();
    secondDegreeConnections.forEach((conn) => {
      const suggestedUserId =
        connectedUserIds.includes(conn.requester_id)
          ? conn.recipient_id
          : conn.requester_id;

      if (suggestedUserId !== user?.id && !connectedUserIds.includes(suggestedUserId)) {
        suggestionMap.set(suggestedUserId, (suggestionMap.get(suggestedUserId) || 0) + 1);
      }
    });

    // Get profiles for suggested users
    const suggestedUserIds = Array.from(suggestionMap.keys()).slice(0, 5);
    if (suggestedUserIds.length === 0) {
      setLoading(false);
      return;
    }

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', suggestedUserIds);

    if (profiles) {
      const profilesWithMutuals = profiles.map((profile) => ({
        ...profile,
        mutual_connections: suggestionMap.get(profile.id) || 0,
      }));

      setSuggestions(profilesWithMutuals.sort((a, b) => b.mutual_connections - a.mutual_connections));
    }

    setLoading(false);
  };

  const handleConnect = async (recipientId: string) => {
    const { error } = await supabase.from('connections').insert({
      requester_id: user?.id,
      recipient_id: recipientId,
      status: 'pending',
    });

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Connection request sent' });
      setSuggestions(suggestions.filter((s) => s.id !== recipientId));
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground">
          Loading...
        </CardContent>
      </Card>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">People You May Know</h3>
        </div>

        <div className="space-y-3">
          {suggestions.map((profile) => (
            <div key={profile.id} className="flex items-center justify-between">
              <div
                className="flex items-center gap-3 flex-1 cursor-pointer"
                onClick={() => navigate(`/profile/${profile.id}`)}
              >
                <Avatar className="h-10 w-10">
                  <AvatarFallback>
                    {profile.full_name?.charAt(0) || profile.email.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{profile.full_name || 'Anonymous User'}</p>
                  <p className="text-xs text-muted-foreground">
                    {profile.mutual_connections} mutual connection
                    {profile.mutual_connections !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <Button size="sm" onClick={() => handleConnect(profile.id)}>
                Connect
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
