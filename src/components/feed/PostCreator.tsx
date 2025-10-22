import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Image, Film, FileText, Smile } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PostCreatorProps {
  onPostCreated: () => void;
}

export const PostCreator = ({ onPostCreated }: PostCreatorProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const initials = user?.email?.[0].toUpperCase() || 'U';

  const handleCreatePost = async () => {
    if (!content.trim() || !user) return;

    setLoading(true);
    const { error } = await supabase
      .from('posts')
      .insert([{
        user_id: user.id,
        content: content.trim()
      }]);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to create post',
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Success',
        description: 'Post created successfully'
      });
      setContent('');
      setOpen(false);
      onPostCreated();
    }
    setLoading(false);
  };

  return (
    <>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <Button
              variant="outline"
              className="flex-1 justify-start text-muted-foreground hover:bg-accent"
              onClick={() => setOpen(true)}
            >
              Start a post...
            </Button>
          </div>
          
          <div className="flex items-center justify-around mt-4 pt-4 border-t">
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              <Image className="h-5 w-5 mr-2" />
              Photo
            </Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              <Film className="h-5 w-5 mr-2" />
              Video
            </Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              <FileText className="h-5 w-5 mr-2" />
              Article
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create a post</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-semibold text-sm">{user?.email}</p>
              </div>
            </div>

            <Textarea
              placeholder="What do you want to talk about?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[150px] resize-none border-0 p-0 focus-visible:ring-0"
            />

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex gap-2">
                <Button variant="ghost" size="icon">
                  <Image className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Smile className="h-5 w-5" />
                </Button>
              </div>
              
              <Button
                onClick={handleCreatePost}
                disabled={!content.trim() || loading}
              >
                {loading ? 'Posting...' : 'Post'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};