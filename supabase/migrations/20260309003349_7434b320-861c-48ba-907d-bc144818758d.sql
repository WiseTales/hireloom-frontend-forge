-- Drop existing policy first
DROP POLICY IF EXISTS "Company members can view applications" ON public.public_applications;
DROP POLICY IF EXISTS "Company members can update applications" ON public.public_applications;

-- Simplify Public Applications RLS: Company members can view/update applications for their company's jobs
CREATE POLICY "Company members view applications"
ON public.public_applications FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.jobs j
    JOIN public.company_users cu ON cu.company_id = j.company_id
    WHERE j.id = public_applications.job_id
    AND cu.user_id = auth.uid()
  )
);

CREATE POLICY "Company members update applications"
ON public.public_applications FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.jobs j
    JOIN public.company_users cu ON cu.company_id = j.company_id
    WHERE j.id = public_applications.job_id
    AND cu.user_id = auth.uid()
  )
);