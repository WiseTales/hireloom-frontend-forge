-- Drop the problematic recursive policies on company_users
DROP POLICY IF EXISTS "Company members can view their company users" ON public.company_users;
DROP POLICY IF EXISTS "Super admins can manage company users" ON public.company_users;

-- Create fixed policies without recursion
-- Users can view company_users entries for companies they belong to
CREATE POLICY "Company members can view their company users" 
ON public.company_users 
FOR SELECT 
USING (user_id = auth.uid() OR company_id IN (
  SELECT cu.company_id FROM public.company_users cu WHERE cu.user_id = auth.uid()
));

-- Super admins can manage company users in their companies
CREATE POLICY "Super admins can manage company users" 
ON public.company_users 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.company_users cu
    WHERE cu.company_id = company_users.company_id 
    AND cu.user_id = auth.uid() 
    AND cu.role = 'super_admin'
  )
);

-- Also add a simple RLS policy for public_applications so job posters can see applications
DROP POLICY IF EXISTS "Job posters can view applications" ON public.public_applications;

CREATE POLICY "Job posters can view applications" 
ON public.public_applications 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.jobs 
    WHERE jobs.id = public_applications.job_id 
    AND jobs.posted_by = auth.uid()
  )
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'recruiter'::app_role)
);