-- Update app_role enum to include new roles
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'interviewer';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'employee';

-- Create permissions enum
CREATE TYPE public.permission_type AS ENUM (
  'create_applicant_profile',
  'schedule_interview',
  'view_job_post',
  'edit_job_post',
  'remove_job_post',
  'review_interview_feedback',
  'submit_interview_feedback',
  'view_applicant_profile',
  'post_job',
  'manage_users',
  'refer_candidate',
  'view_all_interviews',
  'view_own_interviews'
);

-- Create role_permissions table for fine-grained access
CREATE TABLE public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role public.app_role NOT NULL,
  permission public.permission_type NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(role, permission)
);

-- Create applicants table for candidate tracking
CREATE TABLE public.applicants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES public.jobs(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  resume_url text,
  status text DEFAULT 'new' CHECK (status IN ('new', 'screening', 'interviewing', 'offered', 'hired', 'rejected')),
  notes text,
  referred_by uuid REFERENCES auth.users(id),
  created_by uuid REFERENCES auth.users(id) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create interviews table
CREATE TABLE public.interviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_id uuid REFERENCES public.applicants(id) ON DELETE CASCADE NOT NULL,
  job_id uuid REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  interviewer_id uuid REFERENCES auth.users(id) NOT NULL,
  scheduled_at timestamptz NOT NULL,
  duration_minutes integer DEFAULT 60,
  interview_type text DEFAULT 'panel' CHECK (interview_type IN ('phone', 'video', 'panel', 'technical', 'hr')),
  location text,
  meeting_link text,
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create interview_feedback table
CREATE TABLE public.interview_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id uuid REFERENCES public.interviews(id) ON DELETE CASCADE NOT NULL,
  interviewer_id uuid REFERENCES auth.users(id) NOT NULL,
  overall_rating integer CHECK (overall_rating >= 1 AND overall_rating <= 5),
  technical_rating integer CHECK (technical_rating >= 1 AND technical_rating <= 5),
  communication_rating integer CHECK (communication_rating >= 1 AND communication_rating <= 5),
  culture_fit_rating integer CHECK (culture_fit_rating >= 1 AND culture_fit_rating <= 5),
  strengths text,
  weaknesses text,
  recommendation text CHECK (recommendation IN ('strong_hire', 'hire', 'no_hire', 'strong_no_hire')),
  notes text,
  submitted_at timestamptz DEFAULT now(),
  UNIQUE(interview_id, interviewer_id)
);

-- Create referrals table
CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  referrer_id uuid REFERENCES auth.users(id) NOT NULL,
  candidate_name text NOT NULL,
  candidate_email text NOT NULL,
  candidate_phone text,
  relationship text,
  notes text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'applied', 'hired', 'rejected')),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applicants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Role permissions policies
CREATE POLICY "Anyone can view role permissions" ON public.role_permissions FOR SELECT USING (true);

-- Applicants policies
CREATE POLICY "Recruiters and admins can view all applicants" ON public.applicants FOR SELECT 
USING (has_role(auth.uid(), 'recruiter') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Interviewers can view applicants they interview" ON public.applicants FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.interviews WHERE interviews.applicant_id = applicants.id AND interviews.interviewer_id = auth.uid()));

CREATE POLICY "Recruiters can create applicants" ON public.applicants FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'recruiter') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Recruiters can update applicants" ON public.applicants FOR UPDATE 
USING (has_role(auth.uid(), 'recruiter') OR has_role(auth.uid(), 'admin'));

-- Interviews policies
CREATE POLICY "Recruiters and admins can view all interviews" ON public.interviews FOR SELECT 
USING (has_role(auth.uid(), 'recruiter') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Interviewers can view their interviews" ON public.interviews FOR SELECT 
USING (interviewer_id = auth.uid());

CREATE POLICY "Recruiters can manage interviews" ON public.interviews FOR ALL 
USING (has_role(auth.uid(), 'recruiter') OR has_role(auth.uid(), 'admin'));

-- Interview feedback policies
CREATE POLICY "Recruiters and admins can view all feedback" ON public.interview_feedback FOR SELECT 
USING (has_role(auth.uid(), 'recruiter') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Interviewers can view and submit their feedback" ON public.interview_feedback FOR ALL 
USING (interviewer_id = auth.uid());

-- Referrals policies
CREATE POLICY "Employees can create referrals" ON public.referrals FOR INSERT 
WITH CHECK (auth.uid() = referrer_id);

CREATE POLICY "Users can view their own referrals" ON public.referrals FOR SELECT 
USING (referrer_id = auth.uid());

CREATE POLICY "Recruiters can view all referrals" ON public.referrals FOR SELECT 
USING (has_role(auth.uid(), 'recruiter') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Recruiters can update referrals" ON public.referrals FOR UPDATE 
USING (has_role(auth.uid(), 'recruiter') OR has_role(auth.uid(), 'admin'));

-- Create function to check permission
CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _permission permission_type)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON ur.role = rp.role
    WHERE ur.user_id = _user_id
      AND rp.permission = _permission
  )
$$;