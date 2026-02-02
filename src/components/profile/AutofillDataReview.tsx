import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  User, Briefcase, GraduationCap, Wrench, Award, 
  FolderGit2, Save, Loader2, CheckCircle 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ExtractedProfile {
  full_name: string | null;
  headline: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  total_experience_years: number | null;
  summary: string | null;
  experience: {
    role: string;
    company: string;
    location?: string;
    start_date: string | null;
    end_date: string | null;
    currently_working: boolean;
    responsibilities: string[];
  }[] | null;
  education: {
    degree: string;
    institution: string;
    field: string | null;
    start_date: string | null;
    end_date: string | null;
  }[] | null;
  skills_technical: string[] | null;
  skills_soft: string[] | null;
  certifications: {
    name: string;
    issuing_organization: string;
    issue_date: string | null;
  }[] | null;
  projects: {
    title: string;
    description: string;
    technologies: string[];
    url: string | null;
  }[] | null;
  portfolio_links: string[] | null;
  languages: string[] | null;
}

interface AutofillDataReviewProps {
  data: ExtractedProfile;
  profileId: string;
  onSaveComplete: () => void;
}

export const AutofillDataReview = ({ data, profileId, onSaveComplete }: AutofillDataReviewProps) => {
  const [saving, setSaving] = useState(false);
  const [selectedSections, setSelectedSections] = useState({
    profile: true,
    experience: true,
    education: true,
    skills: true,
    certifications: true,
    projects: true,
  });

  const toggleSection = (section: keyof typeof selectedSections) => {
    setSelectedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleSaveAll = async () => {
    setSaving(true);
    
    try {
      // Update profile
      if (selectedSections.profile) {
        await supabase.from('profiles').update({
          full_name: data.full_name || undefined,
          headline: data.headline || undefined,
          bio: data.summary || undefined,
        }).eq('id', profileId);
      }

      // Add experiences
      if (selectedSections.experience && data.experience?.length) {
        for (const exp of data.experience) {
          await supabase.from('work_experience').insert({
            profile_id: profileId,
            title: exp.role,
            company: exp.company,
            location: exp.location || null,
            start_date: exp.start_date || new Date().toISOString().slice(0, 7),
            end_date: exp.currently_working ? null : exp.end_date,
            currently_working: exp.currently_working,
            description: exp.responsibilities?.join('\n') || null,
          });
        }
      }

      // Add education
      if (selectedSections.education && data.education?.length) {
        for (const edu of data.education) {
          await supabase.from('education').insert({
            profile_id: profileId,
            school: edu.institution,
            degree: edu.degree,
            field_of_study: edu.field || null,
            start_date: edu.start_date || new Date().toISOString().slice(0, 7),
            end_date: edu.end_date || null,
          });
        }
      }

      // Add skills
      if (selectedSections.skills) {
        const allSkills = [
          ...(data.skills_technical || []),
          ...(data.skills_soft || []),
        ];
        for (const skill of allSkills) {
          await supabase.from('profile_skills').insert({
            profile_id: profileId,
            skill_name: skill,
          });
        }
      }

      // Add certifications
      if (selectedSections.certifications && data.certifications?.length) {
        for (const cert of data.certifications) {
          await supabase.from('certifications').insert({
            profile_id: profileId,
            name: cert.name,
            issuing_organization: cert.issuing_organization,
            issue_date: cert.issue_date || new Date().toISOString().slice(0, 10),
          });
        }
      }

      // Add projects
      if (selectedSections.projects && data.projects?.length) {
        for (const proj of data.projects) {
          await supabase.from('projects').insert({
            profile_id: profileId,
            title: proj.title,
            description: proj.description,
            url: proj.url || null,
            technologies: proj.technologies || [],
            start_date: new Date().toISOString().slice(0, 10),
          });
        }
      }
      
      toast.success('Profile data saved successfully!');
      onSaveComplete();

    } catch (err) {
      console.error('Save error:', err);
      toast.error('Some data may not have been saved. Please review your profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-primary/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-500" />
          Review Extracted Data
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Profile Info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Checkbox 
              id="profile" 
              checked={selectedSections.profile}
              onCheckedChange={() => toggleSection('profile')}
            />
            <Label htmlFor="profile" className="flex items-center gap-2 font-semibold">
              <User className="h-4 w-4" />
              Profile Information
            </Label>
          </div>
          {selectedSections.profile && (
            <div className="ml-6 p-3 rounded-lg bg-muted/50 space-y-1 text-sm">
              {data.full_name && <p><strong>Name:</strong> {data.full_name}</p>}
              {data.headline && <p><strong>Headline:</strong> {data.headline}</p>}
              {data.location && <p><strong>Location:</strong> {data.location}</p>}
              {data.summary && <p><strong>Summary:</strong> {data.summary.substring(0, 200)}...</p>}
            </div>
          )}
        </div>

        <Separator />

        {/* Experience */}
        {data.experience && data.experience.length > 0 && (
          <>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="experience" 
                  checked={selectedSections.experience}
                  onCheckedChange={() => toggleSection('experience')}
                />
                <Label htmlFor="experience" className="flex items-center gap-2 font-semibold">
                  <Briefcase className="h-4 w-4" />
                  Experience ({data.experience.length})
                </Label>
              </div>
              {selectedSections.experience && (
                <div className="ml-6 space-y-2">
                  {data.experience.map((exp, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-muted/50 text-sm">
                      <p className="font-medium">{exp.role}</p>
                      <p className="text-muted-foreground">{exp.company}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Separator />
          </>
        )}

        {/* Education */}
        {data.education && data.education.length > 0 && (
          <>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="education" 
                  checked={selectedSections.education}
                  onCheckedChange={() => toggleSection('education')}
                />
                <Label htmlFor="education" className="flex items-center gap-2 font-semibold">
                  <GraduationCap className="h-4 w-4" />
                  Education ({data.education.length})
                </Label>
              </div>
              {selectedSections.education && (
                <div className="ml-6 space-y-2">
                  {data.education.map((edu, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-muted/50 text-sm">
                      <p className="font-medium">{edu.degree}{edu.field ? ` in ${edu.field}` : ''}</p>
                      <p className="text-muted-foreground">{edu.institution}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Separator />
          </>
        )}

        {/* Skills */}
        {((data.skills_technical?.length || 0) + (data.skills_soft?.length || 0)) > 0 && (
          <>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="skills" 
                  checked={selectedSections.skills}
                  onCheckedChange={() => toggleSection('skills')}
                />
                <Label htmlFor="skills" className="flex items-center gap-2 font-semibold">
                  <Wrench className="h-4 w-4" />
                  Skills ({(data.skills_technical?.length || 0) + (data.skills_soft?.length || 0)})
                </Label>
              </div>
              {selectedSections.skills && (
                <div className="ml-6 flex flex-wrap gap-2">
                  {data.skills_technical?.map((skill, idx) => (
                    <Badge key={`tech-${idx}`} variant="default">{skill}</Badge>
                  ))}
                  {data.skills_soft?.map((skill, idx) => (
                    <Badge key={`soft-${idx}`} variant="secondary">{skill}</Badge>
                  ))}
                </div>
              )}
            </div>
            <Separator />
          </>
        )}

        {/* Certifications */}
        {data.certifications && data.certifications.length > 0 && (
          <>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="certifications" 
                  checked={selectedSections.certifications}
                  onCheckedChange={() => toggleSection('certifications')}
                />
                <Label htmlFor="certifications" className="flex items-center gap-2 font-semibold">
                  <Award className="h-4 w-4" />
                  Certifications ({data.certifications.length})
                </Label>
              </div>
              {selectedSections.certifications && (
                <div className="ml-6 space-y-2">
                  {data.certifications.map((cert, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-muted/50 text-sm">
                      <p className="font-medium">{cert.name}</p>
                      <p className="text-muted-foreground">{cert.issuing_organization}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Separator />
          </>
        )}

        {/* Projects */}
        {data.projects && data.projects.length > 0 && (
          <>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="projects" 
                  checked={selectedSections.projects}
                  onCheckedChange={() => toggleSection('projects')}
                />
                <Label htmlFor="projects" className="flex items-center gap-2 font-semibold">
                  <FolderGit2 className="h-4 w-4" />
                  Projects ({data.projects.length})
                </Label>
              </div>
              {selectedSections.projects && (
                <div className="ml-6 space-y-2">
                  {data.projects.map((proj, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-muted/50 text-sm">
                      <p className="font-medium">{proj.title}</p>
                      <p className="text-muted-foreground line-clamp-2">{proj.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Save Button */}
        <Button onClick={handleSaveAll} disabled={saving} className="w-full" size="lg">
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving profile data...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Selected Data to Profile
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
