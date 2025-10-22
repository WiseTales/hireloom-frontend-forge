import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { MapPin, Building2, Mail, Calendar, Users, Briefcase } from 'lucide-react';

const Profile = () => {
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const { userId } = useParams();
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({ connections: 0, posts: 0 });
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const profileUserId = userId || user?.id;

  useEffect(() => {
    if (profileUserId) {
      fetchProfile();
    }
  }, [profileUserId]);

  const fetchProfile = async () => {
    setLoading(true);
    
    // Fetch profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profileUserId)
      .single();
    
    if (profileData) setProfile(profileData);

    // Fetch stats
    const [connectionsRes, postsRes] = await Promise.all([
      supabase
        .from('connections')
        .select('id', { count: 'exact' })
        .or(`requester_id.eq.${profileUserId},recipient_id.eq.${profileUserId}`)
        .eq('status', 'accepted'),
      supabase
        .from('posts')
        .select('id', { count: 'exact' })
        .eq('user_id', profileUserId)
    ]);

    setStats({
      connections: connectionsRes.count || 0,
      posts: postsRes.count || 0
    });

    // Fetch user posts
    const { data: postsData } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', profileUserId)
      .order('created_at', { ascending: false });
    
    if (postsData) setPosts(postsData);

    setLoading(false);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen gradient-subtle flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (!profile) {
    return (
      <div className="min-h-screen gradient-subtle flex items-center justify-center">
        <p className="text-muted-foreground">Profile not found</p>
      </div>
    );
  }

  const initials = profile.full_name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase() || profile.email?.[0]?.toUpperCase() || 'U';

  const isOwnProfile = user?.id === profileUserId;

  return (
    <div className="min-h-screen bg-background">
      {/* Header Card */}
      <Card className="border-b rounded-none">
        <div className="h-32 gradient-hero" />
        <CardContent className="relative pb-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-16">
            <Avatar className="h-32 w-32 border-4 border-background">
              <AvatarFallback className="text-3xl font-semibold bg-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 pt-16 sm:pt-0">
              <h1 className="text-2xl font-bold">{profile.full_name || profile.email}</h1>
              <p className="text-muted-foreground">Professional at HireLoom</p>
              <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  Location
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {stats.connections} connections
                </span>
              </div>
            </div>

            {!isOwnProfile && (
              <div className="flex gap-2">
                <Button>Connect</Button>
                <Button variant="outline">Message</Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Card */}
      <div className="container mx-auto px-4 py-6">
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{stats.connections}</p>
                <p className="text-sm text-muted-foreground">Connections</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{stats.posts}</p>
                <p className="text-sm text-muted-foreground">Posts</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-muted-foreground">Followers</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-muted-foreground">Following</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabbed Content */}
        <Tabs defaultValue="about" className="space-y-6">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="experience">Experience</TabsTrigger>
            <TabsTrigger value="education">Education</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
          </TabsList>

          <TabsContent value="about">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4">About</h3>
                <p className="text-muted-foreground">
                  Professional user at HireLoom. Connect with me to explore opportunities and collaborate on projects.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="posts">
            <div className="space-y-4">
              {posts.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <p className="text-muted-foreground">No posts yet</p>
                  </CardContent>
                </Card>
              ) : (
                posts.map((post) => (
                  <Card key={post.id}>
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground mb-2">
                        {new Date(post.created_at).toLocaleDateString()}
                      </p>
                      <p className="whitespace-pre-wrap">{post.content}</p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="experience">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Experience
                </h3>
                <p className="text-muted-foreground">No experience added yet</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="education">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4">Education</h3>
                <p className="text-muted-foreground">No education added yet</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="skills">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4">Skills</h3>
                <p className="text-muted-foreground">No skills added yet</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;