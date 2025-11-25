import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle } from "lucide-react";

interface ProfileCompletionProps {
  profile: any;
  hasExperience: boolean;
  hasEducation: boolean;
  hasSkills: boolean;
}

export const ProfileCompletion = ({ profile, hasExperience, hasEducation, hasSkills }: ProfileCompletionProps) => {
  const items = [
    { label: "Add profile photo", completed: !!profile.avatar_url },
    { label: "Add headline", completed: !!profile.headline },
    { label: "Add bio", completed: !!profile.bio },
    { label: "Add work experience", completed: hasExperience },
    { label: "Add education", completed: hasEducation },
    { label: "Add skills", completed: hasSkills },
    { label: "Upload resume", completed: !!profile.resume_url },
  ];

  const completedCount = items.filter((item) => item.completed).length;
  const percentage = Math.round((completedCount / items.length) * 100);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Strength</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span>Completion</span>
            <span className="font-semibold">{percentage}%</span>
          </div>
          <Progress value={percentage} />
        </div>
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              {item.completed ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground" />
              )}
              <span className={item.completed ? "text-muted-foreground line-through" : ""}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};