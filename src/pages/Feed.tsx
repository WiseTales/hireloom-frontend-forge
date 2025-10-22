import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ProfileCard } from '@/components/feed/ProfileCard';
import { PostCreator } from '@/components/feed/PostCreator';
import { Post } from '@/components/feed/Post';
import { Recommendations } from '@/components/feed/Recommendations';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Feed = () => {
  const { isAuthenticated, user, loading } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [feedType, setFeedType] = useState<'foryou' | 'following'>('foryou');

  useEffect(() => {
    if (user) {
      fetchPosts();
    }
  }, [user]);

  const fetchPosts = async () => {
    setLoadingPosts(true);
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        profiles!posts_user_id_fkey(full_name, email),
        post_reactions(id, reaction_type, user_id)
      `)
      .order('created_at', { ascending: false });

    if (data) {
      setPosts(data);
    }
    setLoadingPosts(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-subtle flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Profile Card (Sticky) */}
          <aside className="hidden lg:block lg:col-span-3">
            <div className="sticky top-20">
              <ProfileCard />
            </div>
          </aside>

          {/* Center Column - Feed */}
          <main className="lg:col-span-6">
            <PostCreator onPostCreated={fetchPosts} />
            
            <div className="mt-4 mb-6 flex items-center justify-between">
              <Tabs value={feedType} onValueChange={(v) => setFeedType(v as 'foryou' | 'following')} className="w-full">
                <TabsList className="w-full grid grid-cols-2">
                  <TabsTrigger value="foryou">For You</TabsTrigger>
                  <TabsTrigger value="following">Following</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {loadingPosts ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading posts...</p>
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-12 card p-6">
                <p className="text-muted-foreground">No posts yet. Be the first to share something!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <Post key={post.id} post={post} onUpdate={fetchPosts} />
                ))}
              </div>
            )}
          </main>

          {/* Right Column - Recommendations (Sticky) */}
          <aside className="hidden lg:block lg:col-span-3">
            <div className="sticky top-20">
              <Recommendations />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Feed;