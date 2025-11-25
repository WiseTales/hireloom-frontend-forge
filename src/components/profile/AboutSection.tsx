import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Pencil, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AboutSectionProps {
  profileId: string;
  bio?: string;
  headline?: string;
  isOwnProfile: boolean;
  onUpdate?: () => void;
}

export const AboutSection = ({ profileId, bio, headline, isOwnProfile, onUpdate }: AboutSectionProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editBio, setEditBio] = useState(bio || "");
  const [editHeadline, setEditHeadline] = useState(headline || "");

  const handleSave = async () => {
    const { error } = await supabase
      .from("profiles")
      .update({ bio: editBio, headline: editHeadline })
      .eq("id", profileId);

    if (error) {
      toast.error("Failed to update profile");
    } else {
      toast.success("Profile updated");
      setIsEditing(false);
      onUpdate?.();
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          About
        </CardTitle>
        {isOwnProfile && !isEditing && (
          <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
            <Pencil className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {isEditing ? (
          <>
            <div>
              <label className="text-sm font-medium mb-2 block">Headline</label>
              <Input
                placeholder="Professional headline"
                value={editHeadline}
                onChange={(e) => setEditHeadline(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Bio</label>
              <Textarea
                placeholder="Tell us about yourself..."
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                rows={6}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave}>Save</Button>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            </div>
          </>
        ) : (
          <>
            {headline && (
              <div>
                <h4 className="font-semibold mb-1">Headline</h4>
                <p className="text-muted-foreground">{headline}</p>
              </div>
            )}
            {bio ? (
              <div>
                <h4 className="font-semibold mb-1">About</h4>
                <p className="text-muted-foreground whitespace-pre-wrap">{bio}</p>
              </div>
            ) : (
              <p className="text-muted-foreground">No bio added yet</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};