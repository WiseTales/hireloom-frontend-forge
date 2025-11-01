import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, ThumbsUp, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface Skill {
  id: string;
  skill_name: string;
  endorsement_count: number;
  user_endorsed: boolean;
}

interface SkillsProps {
  profileId: string;
  isOwnProfile: boolean;
}

export const Skills = ({ profileId, isOwnProfile }: SkillsProps) => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchSkills();
  }, [profileId]);

  const fetchSkills = async () => {
    const { data: skillsData } = await supabase
      .from('profile_skills')
      .select('id, skill_name')
      .eq('profile_id', profileId);

    if (!skillsData) return;

    const skillsWithEndorsements = await Promise.all(
      skillsData.map(async (skill) => {
        const { count } = await supabase
          .from('skill_endorsements')
          .select('id', { count: 'exact' })
          .eq('skill_id', skill.id);

        const { data: userEndorsement } = await supabase
          .from('skill_endorsements')
          .select('id')
          .eq('skill_id', skill.id)
          .eq('endorser_id', user?.id)
          .maybeSingle();

        return {
          ...skill,
          endorsement_count: count || 0,
          user_endorsed: !!userEndorsement,
        };
      })
    );

    setSkills(skillsWithEndorsements);
  };

  const handleAddSkill = async () => {
    if (!newSkill.trim()) return;

    setLoading(true);
    const { error } = await supabase
      .from('profile_skills')
      .insert({ profile_id: profileId, skill_name: newSkill.trim() });

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Skill added successfully' });
      setNewSkill('');
      fetchSkills();
    }
    setLoading(false);
  };

  const handleRemoveSkill = async (skillId: string) => {
    const { error } = await supabase
      .from('profile_skills')
      .delete()
      .eq('id', skillId);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Skill removed' });
      fetchSkills();
    }
  };

  const handleEndorse = async (skillId: string, isEndorsed: boolean) => {
    if (isOwnProfile) {
      toast({
        title: 'Cannot endorse your own skills',
        variant: 'destructive',
      });
      return;
    }

    if (isEndorsed) {
      await supabase
        .from('skill_endorsements')
        .delete()
        .eq('skill_id', skillId)
        .eq('endorser_id', user?.id);
    } else {
      await supabase
        .from('skill_endorsements')
        .insert({ skill_id: skillId, endorser_id: user?.id });
    }

    fetchSkills();
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <h3 className="font-semibold mb-4">Skills & Endorsements</h3>

        {isOwnProfile && (
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Add a skill..."
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
            />
            <Button onClick={handleAddSkill} disabled={loading} size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        )}

        {skills.length === 0 ? (
          <p className="text-muted-foreground">No skills added yet</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <Badge key={skill.id} variant="secondary" className="text-sm py-2 px-3">
                <span>{skill.skill_name}</span>
                <button
                  onClick={() => handleEndorse(skill.id, skill.user_endorsed)}
                  className={`ml-2 flex items-center gap-1 ${
                    skill.user_endorsed ? 'text-primary' : 'text-muted-foreground'
                  }`}
                  disabled={isOwnProfile}
                >
                  <ThumbsUp className="h-3 w-3" />
                  <span className="text-xs">{skill.endorsement_count}</span>
                </button>
                {isOwnProfile && (
                  <button
                    onClick={() => handleRemoveSkill(skill.id)}
                    className="ml-2 text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
