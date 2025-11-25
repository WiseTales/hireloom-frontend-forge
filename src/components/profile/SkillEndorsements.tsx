import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThumbsUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface SkillEndorsementsProps {
  skillId: string;
  skillName: string;
}

export const SkillEndorsements = ({ skillId, skillName }: SkillEndorsementsProps) => {
  const { user } = useAuth();
  const [endorsements, setEndorsements] = useState<any[]>([]);
  const [hasEndorsed, setHasEndorsed] = useState(false);

  useEffect(() => {
    fetchEndorsements();
  }, [skillId]);

  const fetchEndorsements = async () => {
    const { data } = await supabase
      .from("skill_endorsements")
      .select("*, profiles(*)")
      .eq("skill_id", skillId);

    if (data) {
      setEndorsements(data);
      setHasEndorsed(data.some((e) => e.endorser_id === user?.id));
    }
  };

  const handleEndorse = async () => {
    if (hasEndorsed) {
      const { error } = await supabase
        .from("skill_endorsements")
        .delete()
        .eq("skill_id", skillId)
        .eq("endorser_id", user?.id);

      if (!error) {
        toast.success("Endorsement removed");
        fetchEndorsements();
      }
    } else {
      const { error } = await supabase
        .from("skill_endorsements")
        .insert({ skill_id: skillId, endorser_id: user?.id });

      if (!error) {
        toast.success("Skill endorsed");
        fetchEndorsements();
      }
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Badge variant="secondary">
        {skillName}
        <span className="ml-2 text-xs">{endorsements.length}</span>
      </Badge>
      {user && (
        <Button
          size="sm"
          variant={hasEndorsed ? "default" : "outline"}
          onClick={handleEndorse}
        >
          <ThumbsUp className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
};