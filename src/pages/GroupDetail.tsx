import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Users, UserPlus, UserMinus, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Navbar } from '@/components/Navbar';
import { formatDistanceToNow } from 'date-fns';

interface Group {
  id: string;
  name: string;
  description: string;
  member_count: number;
}

interface GroupPost {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: {
    full_name: string;
    email: string;
  };
}

const GroupDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [group, setGroup] = useState<Group | null>(null);
  const [posts, setPosts] = useState<GroupPost[]>([]);
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchGroupData();
  }, [user, id, navigate]);

  const fetchGroupData = async () => {
    try {
      // Fetch group details
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .select('*')
        .eq('id', id)
        .single();

      if (groupError) throw groupError;
      setGroup(groupData);

      // Check membership
      const { data: memberData } = await supabase
        .from('group_members')
        .select('*')
        .eq('group_id', id)
        .eq('user_id', user?.id)
        .single();

      setIsMember(!!memberData);

      // Fetch posts
      const { data: postsData, error: postsError } = await supabase
        .from('group_posts')
        .select(`
          *,
          profiles:user_id (
            full_name,
            email
          )
        `)
        .eq('group_id', id)
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;
      setPosts(postsData || []);
    } catch (error) {
      console.error('Error fetching group data:', error);
      toast.error('Failed to load group');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async () => {
    try {
      const { error } = await supabase
        .from('group_members')
        .insert({
          group_id: id,
          user_id: user?.id,
        });

      if (error) throw error;
      toast.success('Joined group successfully!');
      setIsMember(true);
      fetchGroupData();
    } catch (error) {
      console.error('Error joining group:', error);
      toast.error('Failed to join group');
    }
  };

  const handleLeaveGroup = async () => {
    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', id)
        .eq('user_id', user?.id);

      if (error) throw error;
      toast.success('Left group successfully!');
      setIsMember(false);
      fetchGroupData();
    } catch (error) {
      console.error('Error leaving group:', error);
      toast.error('Failed to leave group');
    }
  };

  const handleCreatePost = async () => {
    if (!newPost.trim()) {
      toast.error('Post content cannot be empty');
      return;
    }

    try {
      const { error } = await supabase
        .from('group_posts')
        .insert({
          group_id: id,
          user_id: user?.id,
          content: newPost,
        });

      if (error) throw error;
      toast.success('Post created!');
      setNewPost('');
      fetchGroupData();
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <p className="text-muted-foreground">Group not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button variant="ghost" onClick={() => navigate('/groups')} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Groups
        </Button>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl">{group.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {group.member_count} member{group.member_count !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              {isMember ? (
                <Button variant="outline" onClick={handleLeaveGroup}>
                  <UserMinus className="h-4 w-4 mr-2" />
                  Leave
                </Button>
              ) : (
                <Button onClick={handleJoinGroup}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Join
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{group.description}</p>
          </CardContent>
        </Card>

        {isMember && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <Textarea
                placeholder="Share something with the group..."
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                rows={3}
                className="mb-4"
              />
              <Button onClick={handleCreatePost} disabled={!newPost.trim()}>
                Post
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {posts.map((post) => (
            <Card key={post.id}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3 mb-3">
                  <Avatar>
                    <AvatarFallback>
                      {post.profiles?.full_name?.[0] || post.profiles?.email?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">
                      {post.profiles?.full_name || post.profiles?.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                <p className="text-foreground whitespace-pre-wrap">{post.content}</p>
              </CardContent>
            </Card>
          ))}
          {posts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No posts yet. Be the first to post!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupDetail;
