-- Add additional columns to public_applications for the extended form
ALTER TABLE public.public_applications
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS current_location TEXT,
ADD COLUMN IF NOT EXISTS current_company TEXT,
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS github_url TEXT,
ADD COLUMN IF NOT EXISTS portfolio_url TEXT,
ADD COLUMN IF NOT EXISTS other_website TEXT,
ADD COLUMN IF NOT EXISTS eligibility_to_work BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS cover_letter TEXT,
ADD COLUMN IF NOT EXISTS consent_to_contact BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- Create storage bucket for resumes if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public uploads to resumes bucket (for anonymous applicants)
CREATE POLICY "Anyone can upload resumes" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'resumes');

-- Allow public reads for resumes
CREATE POLICY "Anyone can read resumes" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'resumes');

-- Make public_applications insertable by anyone (anonymous job seekers)
DROP POLICY IF EXISTS "Anyone can insert public applications" ON public.public_applications;
CREATE POLICY "Anyone can insert public applications"
ON public.public_applications
FOR INSERT
WITH CHECK (true);

-- Allow reading public applications for authenticated admins/recruiters
DROP POLICY IF EXISTS "Authenticated users can view applications for their jobs" ON public.public_applications;
CREATE POLICY "Authenticated users can view applications for their jobs"
ON public.public_applications
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.jobs
    WHERE jobs.id = public_applications.job_id
    AND jobs.posted_by = auth.uid()
  )
);