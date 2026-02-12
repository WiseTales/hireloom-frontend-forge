
-- Create applications table for public career pages
CREATE TABLE IF NOT EXISTS public.applications (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    company_slug text NOT NULL,
    candidate_name text NOT NULL,
    email text NOT NULL,
    phone text,
    resume_url text NOT NULL,
    linkedin_url text,
    parsed_resume_data jsonb,
    source text DEFAULT 'careers_page',
    created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Allow anon users to insert (required for public application form)
CREATE POLICY "Anyone can submit applications"
ON public.applications
FOR INSERT
WITH CHECK (true);

-- Allow authenticated users (recruiters/admins) to view applications
-- We'll assume for now that company members can view them.
-- But for simplicity of this task, we will just allow service role mostly.
CREATE POLICY "Company members can view applications"
ON public.applications
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.jobs j
    JOIN public.company_users cu ON j.company_id = cu.company_id
    WHERE j.id = public.applications.job_id
    AND cu.user_id = auth.uid()
  )
);
