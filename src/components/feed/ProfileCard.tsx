import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Link2, Users, Briefcase, BookOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const ProfileCard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({ connections: 0, posts: 0 });

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchStats();
    }
  }, [user]);

  const fetchProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user?.id)
      .single();
    
    if (data) setProfile(data);
  };

  const fetchStats = async () => {
    const [connectionsRes, postsRes] = await Promise.all([
      supabase
        .from('connections')
        .select('id', { count: 'exact' })
        .or(`requester_id.eq.${user?.id},recipient_id.eq.${user?.id}`)
        .eq('status', 'accepted'),
      supabase
        .from('posts')
        .select('id', { count: 'exact' })
        .eq('user_id', user?.id)
    ]);

    setStats({
      connections: connectionsRes.count || 0,
      posts: postsRes.count || 0
    });
  };

  const copyProfileUrl = () => {
    const url = `${window.location.origin}/profile/${user?.id}`;
    navigator.clipboard.writeText(url);
    toast({
      title: 'Profile URL Copied',
      description: 'Your profile link has been copied to clipboard'
    });
  };

  const initials = profile?.full_name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase() || user?.email?.[0].toUpperCase() || 'U';

  return (
    <Card className="overflow-hidden">
      <div className="h-16 gradient-hero" />
      <CardHeader className="relative pb-0 pt-0">
        <div className="flex flex-col items-center -mt-8">
          <Avatar className="h-16 w-16 border-4 border-background">
            <AvatarFallback className="text-lg font-semibold bg-primary text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          <h3 className="mt-2 font-semibold text-center">
            {profile?.full_name || user?.email}
          </h3>
          <p className="text-sm text-muted-foreground text-center line-clamp-2">
            Professional at HireLoom
          </p>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4 pt-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Connections
            </span>
            <span className="font-semibold">{stats.connections}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Posts
            </span>
            <span className="font-semibold">{stats.posts}</span>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={copyProfileUrl}
        >
          <Link2 className="h-4 w-4 mr-2" />
          Copy Profile URL
        </Button>
      </CardContent>
    </Card>
  );
};