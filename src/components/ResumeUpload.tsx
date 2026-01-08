import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Upload, FileText, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ResumeUploadProps {
  resumeUrl?: string | null;
  onUploadSuccess?: (url: string) => void;
}

export default function ResumeUpload({ resumeUrl, onUploadSuccess }: ResumeUploadProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [currentResume, setCurrentResume] = useState(resumeUrl);

  const getStoragePathFromResumeValue = (value: string) => {
    const marker = '/resumes/';
    const idx = value.indexOf(marker);
    if (idx !== -1) return decodeURIComponent(value.slice(idx + marker.length));
    return value;
  };

  const handleView = async () => {
    if (!currentResume) return;

    try {
      const path = getStoragePathFromResumeValue(currentResume);
      const { data, error } = await supabase.storage
        .from('resumes')
        .createSignedUrl(path, 60, { download: true });

      if (error) throw error;
      window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
    } catch (error: any) {
      toast({
        title: 'Unable to open resume',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    const validTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF or Word document",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/resume.${fileExt}`;

      // Delete old resume if exists
      if (currentResume) {
        await supabase.storage.from("resumes").remove([`${user.id}/resume.${currentResume.split(".").pop()}`]);
      }

      // Upload new resume
      const { error: uploadError } = await supabase.storage
        .from("resumes")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("resumes")
        .getPublicUrl(fileName);

      // Update profile with resume URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ resume_url: publicUrl })
        .eq("id", user.id);

      if (updateError) throw updateError;

      setCurrentResume(publicUrl);
      onUploadSuccess?.(publicUrl);

      toast({
        title: "Resume uploaded successfully",
        description: "Your resume has been saved",
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !currentResume) return;

    try {
      const fileName = `${user.id}/resume.${currentResume.split(".").pop()}`;
      
      await supabase.storage.from("resumes").remove([fileName]);
      
      await supabase
        .from("profiles")
        .update({ resume_url: null })
        .eq("id", user.id);

      setCurrentResume(null);
      onUploadSuccess?.("");

      toast({
        title: "Resume deleted",
        description: "Your resume has been removed",
      });
    } catch (error: any) {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="resume">Resume/CV</Label>
          <p className="text-sm text-muted-foreground mb-2">
            Upload your resume in PDF or Word format (max 5MB)
          </p>
        </div>

        {currentResume ? (
          <div className="flex items-center justify-between p-4 bg-accent rounded-lg">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">Resume uploaded</span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleView}>
                View
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDelete}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="border-2 border-dashed rounded-lg p-6 text-center">
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <Label htmlFor="resume-file" className="cursor-pointer">
              <span className="text-primary hover:underline">Click to upload</span>
              <span className="text-muted-foreground"> or drag and drop</span>
            </Label>
            <Input
              id="resume-file"
              type="file"
              accept=".pdf,.doc,.docx"
              className="hidden"
              onChange={handleFileUpload}
              disabled={uploading}
            />
          </div>
        )}

        {uploading && (
          <p className="text-sm text-muted-foreground text-center">Uploading...</p>
        )}
      </div>
    </Card>
  );
}
