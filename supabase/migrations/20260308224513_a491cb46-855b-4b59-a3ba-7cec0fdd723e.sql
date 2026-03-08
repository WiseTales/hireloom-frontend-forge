
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS responsibilities text[];
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS requirements text[];
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS benefits text[];
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS application_deadline date;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS hiring_manager_name text;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft';
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS experience_required text;

-- Sync existing data
UPDATE public.jobs SET status = 'published' WHERE is_published = true;
UPDATE public.jobs SET status = 'draft' WHERE is_published = false OR is_published IS NULL;

-- Add company member policy for viewing applications (currently only posted_by can see)
DROP POLICY IF EXISTS "Company members can view applications" ON public.public_applications;
CREATE POLICY "Company members can view applications"
ON public.public_applications FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.jobs j
    JOIN public.company_users cu ON cu.company_id = j.company_id
    WHERE j.id = public_applications.job_id
    AND cu.user_id = auth.uid()
  )
);

-- Allow company members to update application status
DROP POLICY IF EXISTS "Company members can update application status" ON public.public_applications;
CREATE POLICY "Company members can update application status"
ON public.public_applications FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.jobs j
    JOIN public.company_users cu ON cu.company_id = j.company_id
    WHERE j.id = public_applications.job_id
    AND cu.user_id = auth.uid()
  )
);
