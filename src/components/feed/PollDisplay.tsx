import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PollDisplayProps {
  postId: string;
}

interface Poll {
  id: string;
  question: string;
  options: string[];
  ends_at: string | null;
}

interface VoteCount {
  option_index: number;
  count: number;
}

export const PollDisplay = ({ postId }: PollDisplayProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [poll, setPoll] = useState<Poll | null>(null);
  const [voteCounts, setVoteCounts] = useState<VoteCount[]>([]);
  const [userVote, setUserVote] = useState<number | null>(null);
  const [totalVotes, setTotalVotes] = useState(0);

  useEffect(() => {
    fetchPoll();
  }, [postId]);

  useEffect(() => {
    if (poll) {
      fetchVotes();

      const channel = supabase
        .channel(`poll_votes_${postId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'poll_votes',
            filter: `poll_id=eq.${poll.id}`,
          },
          () => fetchVotes()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [poll]);

  const fetchPoll = async () => {
    const { data } = await supabase
      .from('polls')
      .select('*')
      .eq('post_id', postId)
      .maybeSingle();

    if (data) {
      setPoll({
        id: data.id,
        question: data.question,
        options: data.options as string[],
        ends_at: data.ends_at,
      });
    }
  };

  const fetchVotes = async () => {
    if (!poll) return;

    const { data: votes } = await supabase
      .from('poll_votes')
      .select('option_index, user_id')
      .eq('poll_id', poll.id);

    if (votes) {
      const counts: { [key: number]: number } = {};
      votes.forEach((vote) => {
        counts[vote.option_index] = (counts[vote.option_index] || 0) + 1;
        if (vote.user_id === user?.id) {
          setUserVote(vote.option_index);
        }
      });

      const countsArray = Object.entries(counts).map(([index, count]) => ({
        option_index: parseInt(index),
        count,
      }));

      setVoteCounts(countsArray);
      setTotalVotes(votes.length);
    }
  };

  const handleVote = async (optionIndex: number) => {
    if (!user || !poll) {
      toast({
        title: 'Login required',
        description: 'Please login to vote',
        variant: 'destructive',
      });
      return;
    }

    if (poll.ends_at && new Date(poll.ends_at) < new Date()) {
      toast({
        title: 'Poll ended',
        description: 'This poll has already ended',
        variant: 'destructive',
      });
      return;
    }

    if (userVote !== null) {
      await supabase
        .from('poll_votes')
        .update({ option_index: optionIndex })
        .eq('poll_id', poll.id)
        .eq('user_id', user.id);
    } else {
      await supabase
        .from('poll_votes')
        .insert({ poll_id: poll.id, user_id: user.id, option_index: optionIndex });
    }

    setUserVote(optionIndex);
    fetchVotes();
  };

  if (!poll) return null;

  const isPollEnded = poll.ends_at && new Date(poll.ends_at) < new Date();

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-4">{poll.question}</h3>

      <div className="space-y-3">
        {poll.options.map((option, index) => {
          const voteCount = voteCounts.find((v) => v.option_index === index)?.count || 0;
          const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
          const isSelected = userVote === index;

          return (
            <div key={index}>
              <Button
                variant={isSelected ? 'default' : 'outline'}
                className="w-full justify-between"
                onClick={() => handleVote(index)}
                disabled={isPollEnded}
              >
                <span className="flex items-center gap-2">
                  {isSelected && <Check className="h-4 w-4" />}
                  {option}
                </span>
                {userVote !== null && (
                  <span className="text-sm">
                    {voteCount} ({percentage.toFixed(0)}%)
                  </span>
                )}
              </Button>
              {userVote !== null && (
                <Progress value={percentage} className="mt-2 h-2" />
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 text-sm text-muted-foreground text-center">
        {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
        {poll.ends_at && (
          <span> • {isPollEnded ? 'Ended' : 'Ends'} {new Date(poll.ends_at).toLocaleDateString()}</span>
        )}
      </div>
    </Card>
  );
};
