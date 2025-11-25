import { useState } from "react";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CoverPhotoProps {
  profileId: string;
  coverPhotoUrl?: string;
  isOwnProfile: boolean;
  onUpdate?: () => void;
}

export const CoverPhoto = ({ profileId, coverPhotoUrl, isOwnProfile, onUpdate }: CoverPhotoProps) => {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const fileExt = file.name.split(".").pop();
    const fileName = `${profileId}-cover-${Date.now()}.${fileExt}`;

    const { error: uploadError, data } = await supabase.storage
      .from("resumes")
      .upload(fileName, file);

    if (uploadError) {
      toast.error("Failed to upload cover photo");
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from("resumes").getPublicUrl(fileName);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ cover_photo_url: publicUrl })
      .eq("id", profileId);

    if (updateError) {
      toast.error("Failed to update profile");
    } else {
      toast.success("Cover photo updated");
      onUpdate?.();
    }
    setUploading(false);
  };

  return (
    <div className="relative h-64 bg-gradient-to-r from-primary to-primary/60 rounded-t-lg overflow-hidden">
      {coverPhotoUrl && (
        <img src={coverPhotoUrl} alt="Cover" className="w-full h-full object-cover" />
      )}
      {isOwnProfile && (
        <div className="absolute bottom-4 right-4">
          <input
            type="file"
            id="cover-upload"
            className="hidden"
            accept="image/*"
            onChange={handleUpload}
            disabled={uploading}
          />
          <label htmlFor="cover-upload">
            <Button size="sm" disabled={uploading} asChild>
              <span className="cursor-pointer">
                <Camera className="h-4 w-4 mr-2" />
                {uploading ? "Uploading..." : "Change Cover"}
              </span>
            </Button>
          </label>
        </div>
      )}
    </div>
  );
};