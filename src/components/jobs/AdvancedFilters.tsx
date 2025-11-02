import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

interface AdvancedFiltersProps {
  onFilterChange: (filters: JobFilters) => void;
}

export interface JobFilters {
  experienceLevel?: string;
  skills?: string[];
  isRemote?: boolean;
  jobType?: string;
  location?: string;
}

export const AdvancedFilters = ({ onFilterChange }: AdvancedFiltersProps) => {
  const [filters, setFilters] = useState<JobFilters>({});
  const [skillInput, setSkillInput] = useState('');

  const handleFilterUpdate = (key: keyof JobFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const addSkill = () => {
    if (skillInput.trim() && !filters.skills?.includes(skillInput.trim())) {
      const newSkills = [...(filters.skills || []), skillInput.trim()];
      handleFilterUpdate('skills', newSkills);
      setSkillInput('');
    }
  };

  const removeSkill = (skill: string) => {
    const newSkills = filters.skills?.filter(s => s !== skill) || [];
    handleFilterUpdate('skills', newSkills.length > 0 ? newSkills : undefined);
  };

  const clearFilters = () => {
    setFilters({});
    onFilterChange({});
    setSkillInput('');
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Advanced Filters</h3>
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          Clear All
        </Button>
      </div>

      <div className="space-y-4">
        <div>
          <Label>Experience Level</Label>
          <Select
            value={filters.experienceLevel}
            onValueChange={(value) => handleFilterUpdate('experienceLevel', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="entry">Entry Level</SelectItem>
              <SelectItem value="mid">Mid Level</SelectItem>
              <SelectItem value="senior">Senior Level</SelectItem>
              <SelectItem value="lead">Lead</SelectItem>
              <SelectItem value="executive">Executive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Job Type</Label>
          <Select
            value={filters.jobType}
            onValueChange={(value) => handleFilterUpdate('jobType', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="full-time">Full Time</SelectItem>
              <SelectItem value="part-time">Part Time</SelectItem>
              <SelectItem value="contract">Contract</SelectItem>
              <SelectItem value="freelance">Freelance</SelectItem>
              <SelectItem value="internship">Internship</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Required Skills</Label>
          <div className="flex gap-2 mb-2">
            <Input
              placeholder="Add skill (e.g., React, Python)"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addSkill()}
            />
            <Button onClick={addSkill} size="sm">Add</Button>
          </div>
          {filters.skills && filters.skills.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {filters.skills.map((skill) => (
                <Badge key={skill} variant="secondary">
                  {skill}
                  <button onClick={() => removeSkill(skill)} className="ml-1">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div>
          <Label>Location</Label>
          <Input
            placeholder="City, State, or Country"
            value={filters.location || ''}
            onChange={(e) => handleFilterUpdate('location', e.target.value || undefined)}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="remote"
            checked={filters.isRemote}
            onCheckedChange={(checked) => handleFilterUpdate('isRemote', checked)}
          />
          <Label htmlFor="remote" className="cursor-pointer">
            Remote Only
          </Label>
        </div>
      </div>
    </Card>
  );
};
