import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Eye } from 'lucide-react';

interface ProfileView {
  id: string;
  viewed_at: string;
  profiles?: {
    full_name: string;
    email: string;
  };
}

export const ProfileViews = () => {
  const { user } = useAuth();
  const [views, setViews] = useState<ProfileView[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfileViews();
    }
  }, [user]);

  const fetchProfileViews = async () => {
    const { data, error } = await supabase
      .from('profile_views')
      .select(`
        id,
        viewed_at,
        profiles!profile_views_viewer_id_fkey(full_name, email)
      `)
      .eq('profile_id', user?.id)
      .order('viewed_at', { ascending: false })
      .limit(10);

    if (data) {
      setViews(data as ProfileView[]);
    }
    setLoading(false);
  };

  const timeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return new Date(date).toLocaleDateString();
  };

  if (loading) {
    return (
      <Card className="p-6">
        <p className="text-muted-foreground text-center">Loading...</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Eye className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Profile Views</h3>
      </div>

      {views.length === 0 ? (
        <p className="text-muted-foreground text-center py-4">
          No profile views yet
        </p>
      ) : (
        <div className="space-y-3">
          {views.map((view) => (
            <div key={view.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>
                    {view.profiles?.full_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">
                    {view.profiles?.full_name || 'Anonymous User'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {view.profiles?.email || ''}
                  </p>
                </div>
              </div>
              <span className="text-sm text-muted-foreground">
                {timeAgo(view.viewed_at)}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
