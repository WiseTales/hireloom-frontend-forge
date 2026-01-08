-- Tighten access: only job poster (posted_by) or app admins can view/update applications

-- View policy
DROP POLICY IF EXISTS "Job posters can view applications" ON public.public_applications;
CREATE POLICY "Job posters can view applications"
ON public.public_applications
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.jobs
    WHERE jobs.id = public_applications.job_id
      AND jobs.posted_by = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- Update policy
DROP POLICY IF EXISTS "Job posters can update application status" ON public.public_applications;
CREATE POLICY "Job posters can update application status"
ON public.public_applications
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.jobs
    WHERE jobs.id = public_applications.job_id
      AND jobs.posted_by = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.jobs
    WHERE jobs.id = public_applications.job_id
      AND jobs.posted_by = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- Remove redundant select policy (keeps the rules clearer)
DROP POLICY IF EXISTS "Authenticated users can view applications for their jobs" ON public.public_applications;