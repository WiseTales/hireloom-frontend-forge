import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Briefcase, Calendar, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Experience {
  id: string;
  title: string;
  company: string;
  location?: string;
  start_date: string;
  end_date?: string;
  description?: string;
  currently_working: boolean;
}

interface ExperienceProps {
  profileId: string;
  isOwnProfile: boolean;
}

export const Experience = ({ profileId, isOwnProfile }: ExperienceProps) => {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    company: "",
    location: "",
    start_date: "",
    end_date: "",
    description: "",
    currently_working: false,
  });

  useEffect(() => {
    fetchExperiences();
  }, [profileId]);

  const fetchExperiences = async () => {
    const { data, error } = await supabase
      .from("work_experience")
      .select("*")
      .eq("profile_id", profileId)
      .order("start_date", { ascending: false });

    if (!error && data) {
      setExperiences(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("work_experience").insert({
      ...formData,
      profile_id: profileId,
      end_date: formData.currently_working ? null : formData.end_date,
    });

    if (error) {
      toast.error("Failed to add experience");
    } else {
      toast.success("Experience added");
      setIsOpen(false);
      setFormData({
        title: "",
        company: "",
        location: "",
        start_date: "",
        end_date: "",
        description: "",
        currently_working: false,
      });
      fetchExperiences();
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
          <Briefcase className="h-5 w-5" />
          Experience
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
                <DialogTitle>Add Experience</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  placeholder="Title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
                <Input
                  placeholder="Company"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  required
                />
                <Input
                  placeholder="Location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
                <Input
                  type="month"
                  placeholder="Start Date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  required
                />
                {!formData.currently_working && (
                  <Input
                    type="month"
                    placeholder="End Date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                )}
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.currently_working}
                    onChange={(e) => setFormData({ ...formData, currently_working: e.target.checked })}
                  />
                  I currently work here
                </label>
                <Textarea
                  placeholder="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
                <Button type="submit" className="w-full">Add Experience</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {experiences.length === 0 ? (
          <p className="text-muted-foreground">No experience added yet</p>
        ) : (
          experiences.map((exp) => (
            <div key={exp.id} className="border-b last:border-0 pb-4 last:pb-0">
              <h4 className="font-semibold">{exp.title}</h4>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <Building2 className="h-4 w-4" />
                <span>{exp.company}</span>
              </div>
              {exp.location && (
                <p className="text-sm text-muted-foreground">{exp.location}</p>
              )}
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <Calendar className="h-4 w-4" />
                <span>
                  {formatDate(exp.start_date)} - {exp.currently_working ? "Present" : exp.end_date ? formatDate(exp.end_date) : ""}
                </span>
              </div>
              {exp.description && (
                <p className="text-sm mt-2 whitespace-pre-wrap">{exp.description}</p>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};
