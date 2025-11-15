import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, GraduationCap, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Education {
  id: string;
  school: string;
  degree: string;
  field_of_study?: string;
  start_date: string;
  end_date?: string;
  description?: string;
}

interface EducationProps {
  profileId: string;
  isOwnProfile: boolean;
}

export const Education = ({ profileId, isOwnProfile }: EducationProps) => {
  const [education, setEducation] = useState<Education[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    school: "",
    degree: "",
    field_of_study: "",
    start_date: "",
    end_date: "",
    description: "",
  });

  useEffect(() => {
    fetchEducation();
  }, [profileId]);

  const fetchEducation = async () => {
    const { data, error } = await supabase
      .from("education")
      .select("*")
      .eq("profile_id", profileId)
      .order("start_date", { ascending: false });

    if (!error && data) {
      setEducation(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("education").insert({
      ...formData,
      profile_id: profileId,
    });

    if (error) {
      toast.error("Failed to add education");
    } else {
      toast.success("Education added");
      setIsOpen(false);
      setFormData({
        school: "",
        degree: "",
        field_of_study: "",
        start_date: "",
        end_date: "",
        description: "",
      });
      fetchEducation();
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5" />
          Education
        </CardTitle>
        {isOwnProfile && (
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Education</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  placeholder="School"
                  value={formData.school}
                  onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                  required
                />
                <Input
                  placeholder="Degree"
                  value={formData.degree}
                  onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                  required
                />
                <Input
                  placeholder="Field of Study"
                  value={formData.field_of_study}
                  onChange={(e) => setFormData({ ...formData, field_of_study: e.target.value })}
                />
                <Input
                  type="month"
                  placeholder="Start Date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  required
                />
                <Input
                  type="month"
                  placeholder="End Date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
                <Textarea
                  placeholder="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
                <Button type="submit" className="w-full">Add Education</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {education.length === 0 ? (
          <p className="text-muted-foreground">No education added yet</p>
        ) : (
          education.map((edu) => (
            <div key={edu.id} className="border-b last:border-0 pb-4 last:pb-0">
              <h4 className="font-semibold">{edu.school}</h4>
              <p className="text-sm mt-1">
                {edu.degree}
                {edu.field_of_study && `, ${edu.field_of_study}`}
              </p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <Calendar className="h-4 w-4" />
                <span>
                  {formatDate(edu.start_date)} - {edu.end_date ? formatDate(edu.end_date) : "Present"}
                </span>
              </div>
              {edu.description && (
                <p className="text-sm mt-2 whitespace-pre-wrap">{edu.description}</p>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};
