import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ThumbsUp, Heart, Lightbulb, Award, MessageCircle, Share2, MoreHorizontal } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface PostProps {
  post: any;
  onUpdate: () => void;
}

export const Post = ({ post, onUpdate }: PostProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reacting, setReacting] = useState(false);

  type ReactionType = 'like' | 'love' | 'insightful' | 'celebrate' | 'support';

  const reactions: { type: ReactionType; icon: any; label: string; color: string }[] = [
    { type: 'like', icon: ThumbsUp, label: 'Like', color: 'text-blue-600' },
    { type: 'love', icon: Heart, label: 'Love', color: 'text-red-600' },
    { type: 'insightful', icon: Lightbulb, label: 'Insightful', color: 'text-yellow-600' },
    { type: 'celebrate', icon: Award, label: 'Celebrate', color: 'text-green-600' },
  ];

  const userReaction = post.post_reactions?.find((r: any) => r.user_id === user?.id);
  const reactionCounts = post.post_reactions?.reduce((acc: any, r: any) => {
    acc[r.reaction_type] = (acc[r.reaction_type] || 0) + 1;
    return acc;
  }, {});

  const handleReaction = async (reactionType: 'like' | 'love' | 'insightful' | 'celebrate' | 'support') => {
    if (reacting || !user) return;
    setReacting(true);

    if (userReaction) {
      if (userReaction.reaction_type === reactionType) {
        // Remove reaction
        await supabase
          .from('post_reactions')
          .delete()
          .eq('id', userReaction.id);
      } else {
        // Update reaction
        await supabase
          .from('post_reactions')
          .update({ reaction_type: reactionType as any })
          .eq('id', userReaction.id);
      }
    } else {
      // Add reaction
      await supabase
        .from('post_reactions')
        .insert([{
          post_id: post.id,
          user_id: user.id,
          reaction_type: reactionType as any
        }]);
    }

    onUpdate();
    setReacting(false);
  };

  const handleShare = (action: string) => {
    if (action === 'copy') {
      navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
      toast({ title: 'Link copied to clipboard' });
    }
  };

  const initials = post.profiles?.full_name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase() || post.profiles?.email?.[0]?.toUpperCase() || 'U';

  const timeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{post.profiles?.full_name || post.profiles?.email}</p>
              <p className="text-xs text-muted-foreground">{timeAgo(post.created_at)}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-5 w-5" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="whitespace-pre-wrap">{post.content}</p>

        {post.image_url && (
          <img
            src={post.image_url}
            alt="Post content"
            className="rounded-lg w-full object-cover max-h-96"
          />
        )}

        {post.post_reactions?.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
            <div className="flex -space-x-1">
              {Object.keys(reactionCounts).slice(0, 3).map((type) => {
                const reaction = reactions.find(r => r.type === type);
                if (!reaction) return null;
                return (
                  <div key={type} className="h-5 w-5 rounded-full bg-background flex items-center justify-center border">
                    <reaction.icon className={`h-3 w-3 ${reaction.color}`} />
                  </div>
                );
              })}
            </div>
            <span>{post.post_reactions.length}</span>
          </div>
        )}

        <div className="flex items-center gap-1 pt-2 border-t">
          {reactions.map((reaction) => {
            const Icon = reaction.icon;
            const isActive = userReaction?.reaction_type === reaction.type;
            return (
              <Button
                key={reaction.type}
                variant="ghost"
                size="sm"
                className={`flex-1 ${isActive ? reaction.color : 'text-muted-foreground'}`}
                onClick={() => handleReaction(reaction.type)}
                disabled={reacting}
              >
                <Icon className="h-4 w-4 mr-1" />
                {reaction.label}
              </Button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 border-t pt-2">
          <Button variant="ghost" size="sm" className="flex-1 text-muted-foreground">
            <MessageCircle className="h-4 w-4 mr-2" />
            Comment
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="flex-1 text-muted-foreground">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleShare('repost')}>
                Repost
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleShare('send')}>
                Send via message
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleShare('copy')}>
                Copy link
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
};