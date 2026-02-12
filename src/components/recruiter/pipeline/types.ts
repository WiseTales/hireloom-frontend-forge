export type Stage = 'applied' | 'under_review' | 'shortlisted' | 'rejected';

export interface Candidate {
  id: string;
  full_name: string;
  email: string;
  status: Stage;
  job_title: string;
  applied_at: string;
  resume_url?: string;
  assigned_to?: string;
}

export const STAGES: { id: Stage; label: string; color: string }[] = [
  { id: 'applied', label: 'Applied', color: 'bg-blue-100 text-blue-700' },
  { id: 'under_review', label: 'Interview', color: 'bg-purple-100 text-purple-700' },
  { id: 'shortlisted', label: 'Offer', color: 'bg-orange-100 text-orange-700' },
  { id: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-700' },
];
