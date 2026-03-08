
-- Drop the restrictive recruiter-only policies
DROP POLICY IF EXISTS "Recruiters can create jobs" ON public.jobs;
DROP POLICY IF EXISTS "Recruiters can update their own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Recruiters can delete their own jobs" ON public.jobs;

-- Allow company members to create jobs for their company
CREATE POLICY "Company members can create jobs"
ON public.jobs FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = posted_by
  AND is_company_member(company_id, auth.uid())
);

-- Allow company members to update their company's jobs
CREATE POLICY "Company members can update jobs"
ON public.jobs FOR UPDATE TO authenticated
USING (is_company_member(company_id, auth.uid()));

-- Allow company members to delete their company's jobs
CREATE POLICY "Company members can delete jobs"
ON public.jobs FOR DELETE TO authenticated
USING (is_company_member(company_id, auth.uid()));
