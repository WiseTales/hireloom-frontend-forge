import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles, X, Plus } from 'lucide-react';

interface JobPostFormProps {
  user: any;
  companyInfo: any;
  onJobCreated: () => void;
}

export default function JobPostForm({ user, companyInfo, onJobCreated }: JobPostFormProps) {
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [location, setLocation] = useState('');
  const [locationTypeVal, setLocationTypeVal] = useState('onsite');
  const [salary, setSalary] = useState('');
  const [jobType, setJobType] = useState('Full-time');
  const [category, setCategory] = useState('Engineering');
  const [experienceLevel, setExperienceLevel] = useState('Mid');
  const [experienceRequired, setExperienceRequired] = useState('');
  const [visibility, setVisibility] = useState<'external' | 'internal'>('external');
  const [description, setDescription] = useState('');

  // New fields
  const [skillsInput, setSkillsInput] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [responsibilities, setResponsibilities] = useState<string[]>(['']);
  const [requirements, setRequirements] = useState<string[]>(['']);
  const [benefits, setBenefits] = useState<string[]>(['']);
  const [applicationDeadline, setApplicationDeadline] = useState('');
  const [hiringManagerName, setHiringManagerName] = useState('');

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const addSkill = () => {
    const s = skillsInput.trim();
    if (s && !skills.includes(s)) {
      setSkills([...skills, s]);
      setSkillsInput('');
    }
  };

  const removeSkill = (idx: number) => setSkills(skills.filter((_, i) => i !== idx));

  const updateListItem = (list: string[], setList: (v: string[]) => void, idx: number, val: string) => {
    const updated = [...list];
    updated[idx] = val;
    setList(updated);
  };

  const addListItem = (list: string[], setList: (v: string[]) => void) => setList([...list, '']);
  const removeListItem = (list: string[], setList: (v: string[]) => void, idx: number) => {
    if (list.length <= 1) return;
    setList(list.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent, status: 'draft' | 'published') => {
    e.preventDefault();
    if (!user || !companyInfo) return;
    setFormLoading(true);
    setFormError('');

    const isPublished = status === 'published';
    const cleanList = (arr: string[]) => arr.map(s => s.trim()).filter(Boolean);

    const jobData: any = {
      company_id: companyInfo.id,
      company: companyInfo.name,
      posted_by: user.id,
      title,
      department: department || null,
      description,
      location,
      location_type: locationTypeVal,
      salary: salary || null,
      type: jobType,
      category,
      visibility,
      is_published: isPublished,
      status,
      experience_level: experienceLevel,
      experience_required: experienceRequired || null,
      skills_required: skills.length > 0 ? skills : null,
      responsibilities: cleanList(responsibilities).length > 0 ? cleanList(responsibilities) : null,
      requirements: cleanList(requirements).length > 0 ? cleanList(requirements) : null,
      benefits: cleanList(benefits).length > 0 ? cleanList(benefits) : null,
      application_deadline: applicationDeadline || null,
      hiring_manager_name: hiringManagerName || null,
    };

    const { error } = await supabase.from('jobs').insert(jobData);

    if (error) {
      setFormError(error.message);
    } else {
      // Reset form
      setTitle(''); setDepartment(''); setDescription(''); setLocation('');
      setSalary(''); setJobType('Full-time'); setCategory('Engineering');
      setExperienceLevel('Mid'); setExperienceRequired('');
      setVisibility('external'); setSkills([]); setSkillsInput('');
      setResponsibilities(['']); setRequirements(['']); setBenefits(['']);
      setApplicationDeadline(''); setHiringManagerName('');
      onJobCreated();
    }
    setFormLoading(false);
  };

  const handleAIGenerate = async () => {
    if (!title.trim()) { setFormError('Enter a job title first'); return; }
    setAiLoading(true);
    setFormError('');

    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/ai-generate-job`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: JSON.stringify({
            title,
            department: department || undefined,
            experience_level: experienceLevel,
            skills: skills.length > 0 ? skills : undefined,
          }),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'AI generation failed');
      }

      const data = await res.json();
      if (data.description) setDescription(data.description);
      if (data.responsibilities?.length) setResponsibilities(data.responsibilities);
      if (data.requirements?.length) setRequirements(data.requirements);
      if (data.benefits?.length) setBenefits(data.benefits);
      if (data.skills?.length) setSkills(data.skills);
    } catch (err: any) {
      setFormError(err.message || 'AI generation failed');
    }
    setAiLoading(false);
  };

  const inputClass = "w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm bg-background text-foreground";
  const labelClass = "block text-sm font-medium text-foreground mb-1";

  return (
    <div className="bg-card rounded-xl shadow-sm border border-border p-6 sticky top-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-heading font-semibold text-foreground">Post New Job</h2>
        <button
          type="button"
          onClick={handleAIGenerate}
          disabled={aiLoading || !title.trim()}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors disabled:opacity-50"
        >
          <Sparkles className="w-3.5 h-3.5" />
          {aiLoading ? 'Generating...' : 'Generate with AI'}
        </button>
      </div>

      <form onSubmit={(e) => handleSubmit(e, 'published')} className="space-y-4">
        {/* Basic Info */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Basic Information</p>
          <div>
            <label className={labelClass}>Job Title *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required className={inputClass} placeholder="e.g. Senior Software Engineer" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Department</label>
              <input value={department} onChange={(e) => setDepartment(e.target.value)} className={inputClass} placeholder="e.g. Engineering" />
            </div>
            <div>
              <label className={labelClass}>Location *</label>
              <input value={location} onChange={(e) => setLocation(e.target.value)} required className={inputClass} placeholder="e.g. San Francisco" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Work Arrangement</label>
              <select value={locationTypeVal} onChange={(e) => setLocationTypeVal(e.target.value)} className={inputClass}>
                <option value="onsite">On-site</option>
                <option value="hybrid">Hybrid</option>
                <option value="remote">Remote</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Salary Range</label>
              <input value={salary} onChange={(e) => setSalary(e.target.value)} className={inputClass} placeholder="e.g. $120k-$180k" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Job Type</label>
              <select value={jobType} onChange={(e) => setJobType(e.target.value)} className={inputClass}>
                <option>Full-time</option><option>Part-time</option><option>Contract</option><option>Internship</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
                <option>Engineering</option><option>Design</option><option>Marketing</option><option>Sales</option><option>Operations</option><option>HR</option><option>Finance</option><option>Other</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Experience Level</label>
              <select value={experienceLevel} onChange={(e) => setExperienceLevel(e.target.value)} className={inputClass}>
                <option>Entry</option><option>Mid</option><option>Senior</option><option>Lead</option><option>Manager</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Experience Required</label>
              <input value={experienceRequired} onChange={(e) => setExperienceRequired(e.target.value)} className={inputClass} placeholder="e.g. 3+ years" />
            </div>
          </div>
          <div>
            <label className={labelClass}>Visibility</label>
            <select value={visibility} onChange={(e) => setVisibility(e.target.value as any)} className={inputClass}>
              <option value="external">External (Public Career Page)</option>
              <option value="internal">Internal Only</option>
            </select>
          </div>
        </div>

        {/* Skills */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-2">Skills</p>
          <div className="flex gap-2">
            <input
              value={skillsInput}
              onChange={(e) => setSkillsInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
              className={inputClass}
              placeholder="Type skill and press Enter"
            />
            <button type="button" onClick={addSkill} className="px-3 py-2 bg-muted text-foreground rounded-lg text-sm hover:bg-accent transition-colors">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          {skills.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {skills.map((s, i) => (
                <span key={i} className="flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                  {s}
                  <button type="button" onClick={() => removeSkill(i)} className="hover:text-destructive"><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Responsibilities */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-2">Responsibilities</p>
            <button type="button" onClick={() => addListItem(responsibilities, setResponsibilities)} className="text-xs text-primary hover:underline">+ Add</button>
          </div>
          {responsibilities.map((r, i) => (
            <div key={i} className="flex gap-2">
              <input value={r} onChange={(e) => updateListItem(responsibilities, setResponsibilities, i, e.target.value)} className={inputClass} placeholder={`Responsibility ${i + 1}`} />
              {responsibilities.length > 1 && (
                <button type="button" onClick={() => removeListItem(responsibilities, setResponsibilities, i)} className="px-2 text-muted-foreground hover:text-destructive"><X className="w-4 h-4" /></button>
              )}
            </div>
          ))}
        </div>

        {/* Requirements */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-2">Requirements</p>
            <button type="button" onClick={() => addListItem(requirements, setRequirements)} className="text-xs text-primary hover:underline">+ Add</button>
          </div>
          {requirements.map((r, i) => (
            <div key={i} className="flex gap-2">
              <input value={r} onChange={(e) => updateListItem(requirements, setRequirements, i, e.target.value)} className={inputClass} placeholder={`Requirement ${i + 1}`} />
              {requirements.length > 1 && (
                <button type="button" onClick={() => removeListItem(requirements, setRequirements, i)} className="px-2 text-muted-foreground hover:text-destructive"><X className="w-4 h-4" /></button>
              )}
            </div>
          ))}
        </div>

        {/* Benefits */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-2">Benefits</p>
            <button type="button" onClick={() => addListItem(benefits, setBenefits)} className="text-xs text-primary hover:underline">+ Add</button>
          </div>
          {benefits.map((b, i) => (
            <div key={i} className="flex gap-2">
              <input value={b} onChange={(e) => updateListItem(benefits, setBenefits, i, e.target.value)} className={inputClass} placeholder={`Benefit ${i + 1}`} />
              {benefits.length > 1 && (
                <button type="button" onClick={() => removeListItem(benefits, setBenefits, i)} className="px-2 text-muted-foreground hover:text-destructive"><X className="w-4 h-4" /></button>
              )}
            </div>
          ))}
        </div>

        {/* Description */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-2 mb-2">Job Details</p>
          <label className={labelClass}>Full Description *</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows={6}
            className={`${inputClass} resize-none`} placeholder="Describe the role in detail..." />
        </div>

        {/* Optional fields */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Application Deadline</label>
            <input type="date" value={applicationDeadline} onChange={(e) => setApplicationDeadline(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Hiring Manager</label>
            <input value={hiringManagerName} onChange={(e) => setHiringManagerName(e.target.value)} className={inputClass} placeholder="Name" />
          </div>
        </div>

        {formError && <div className="bg-destructive/10 text-destructive px-3 py-2 rounded-lg text-sm">{formError}</div>}

        <div className="flex gap-2">
          <button type="submit" disabled={formLoading}
            className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50">
            {formLoading ? 'Publishing...' : 'Publish Job'}
          </button>
          <button type="button" disabled={formLoading} onClick={(e) => handleSubmit(e, 'draft')}
            className="px-4 py-2.5 border border-border text-foreground rounded-lg text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50">
            Save Draft
          </button>
        </div>
      </form>
    </div>
  );
}
