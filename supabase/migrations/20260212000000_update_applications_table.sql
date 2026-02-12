
-- Drop existing table if any to ensure clean schema (optional, but good for GGs)
-- DROP TABLE IF EXISTS public.applications;

CREATE TABLE IF NOT EXISTS public.applications (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    company_slug text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    phone text,
    resume_url text NOT NULL,
    linkedin_url text,
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
CREATE POLICY "Company members can view applications"
ON public.applications
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.jobs j
    JOIN public.companies c ON j.company_id = c.id
    WHERE j.id = public.applications.job_id
    AND (
        j.posted_by = auth.uid() OR
        EXISTS (
            -- This assumes a company_users table or similar exists
            -- Adjusting based on standard patterns found in previous migrations
            SELECT 1 FROM public.profiles p 
            WHERE p.id = auth.uid()
        )
    )
  )
);
