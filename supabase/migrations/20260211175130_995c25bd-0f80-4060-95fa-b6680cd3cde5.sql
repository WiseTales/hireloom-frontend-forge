
-- Add slug column to companies for public API lookups
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS slug text UNIQUE;

-- Create index for fast slug lookups
CREATE INDEX IF NOT EXISTS idx_companies_slug ON public.companies(slug);

-- Add source column to public_applications to track where applications came from
ALTER TABLE public.public_applications ADD COLUMN IF NOT EXISTS source text DEFAULT 'direct';

-- Add source column to job_applications too
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS source text DEFAULT 'direct';

-- Allow public (anon) to read published external jobs (needed for the public API)
-- The edge function uses service role, so no policy change needed for that.

-- Allow anon users to insert into public_applications (for external careers pages)
CREATE POLICY "Anyone can submit public applications"
ON public.public_applications
FOR INSERT
WITH CHECK (true);

-- Allow anon users to read companies by slug (for co-branding)
-- companies already has "Anyone can view companies" SELECT policy
