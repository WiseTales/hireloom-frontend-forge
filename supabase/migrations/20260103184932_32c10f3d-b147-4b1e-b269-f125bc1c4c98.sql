-- Create new enums for B2B job system
CREATE TYPE public.location_type AS ENUM ('onsite', 'hybrid', 'remote');
CREATE TYPE public.work_type AS ENUM ('contractor', 'permanent', 'intern');
CREATE TYPE public.job_visibility AS ENUM ('internal', 'external');
CREATE TYPE public.company_role AS ENUM ('super_admin', 'hiring_manager', 'recruiter', 'viewer');

-- Create company_users table to link users to companies with roles
CREATE TABLE public.company_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  role company_role NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(company_id, user_id)
);

-- Create company_permissions table
CREATE TABLE public.company_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role company_role NOT NULL,
  permission TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(role, permission)
);

-- Insert default permissions for each role
INSERT INTO public.company_permissions (role, permission) VALUES
  ('super_admin', 'create_job'),
  ('super_admin', 'edit_job'),
  ('super_admin', 'delete_job'),
  ('super_admin', 'publish_job'),
  ('super_admin', 'view_applicants'),
  ('super_admin', 'shortlist_applicants'),
  ('super_admin', 'manage_users'),
  ('super_admin', 'manage_company'),
  ('hiring_manager', 'create_job'),
  ('hiring_manager', 'edit_job'),
  ('hiring_manager', 'publish_job'),
  ('hiring_manager', 'view_applicants'),
  ('hiring_manager', 'shortlist_applicants'),
  ('recruiter', 'view_applicants'),
  ('recruiter', 'shortlist_applicants'),
  ('viewer', 'view_jobs');

-- Add new columns to jobs table
ALTER TABLE public.jobs 
  ADD COLUMN IF NOT EXISTS location_type location_type DEFAULT 'onsite',
  ADD COLUMN IF NOT EXISTS work_type work_type DEFAULT 'permanent',
  ADD COLUMN IF NOT EXISTS visibility job_visibility DEFAULT 'external',
  ADD COLUMN IF NOT EXISTS team TEXT,
  ADD COLUMN IF NOT EXISTS department TEXT,
  ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false;

-- Create public_applications table for applicants (no account needed)
CREATE TABLE public.public_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  resume_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.company_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_applications ENABLE ROW LEVEL SECURITY;

-- RLS for company_users
CREATE POLICY "Company members can view their company users"
ON public.company_users FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.company_users cu
    WHERE cu.company_id = company_users.company_id
    AND cu.user_id = auth.uid()
  )
);

CREATE POLICY "Super admins can manage company users"
ON public.company_users FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.company_users cu
    WHERE cu.company_id = company_users.company_id
    AND cu.user_id = auth.uid()
    AND cu.role = 'super_admin'
  )
);

-- RLS for company_permissions (read-only for all authenticated)
CREATE POLICY "Anyone can view permissions"
ON public.company_permissions FOR SELECT
USING (true);

-- RLS for public_applications
CREATE POLICY "Anyone can submit applications"
ON public.public_applications FOR INSERT
WITH CHECK (true);

CREATE POLICY "Company members can view their job applications"
ON public.public_applications FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.jobs j
    JOIN public.company_users cu ON cu.company_id = j.company_id
    WHERE j.id = public_applications.job_id
    AND cu.user_id = auth.uid()
  )
);

-- Helper function to check company permission
CREATE OR REPLACE FUNCTION public.has_company_permission(_user_id UUID, _company_id UUID, _permission TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.company_users cu
    JOIN public.company_permissions cp ON cu.role = cp.role
    WHERE cu.user_id = _user_id
      AND cu.company_id = _company_id
      AND cp.permission = _permission
  )
$$;

-- Function to get user's company
CREATE OR REPLACE FUNCTION public.get_user_company(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.company_users WHERE user_id = _user_id LIMIT 1
$$;