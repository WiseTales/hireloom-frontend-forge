
-- Migration to add status and company_slug to jobs table
-- These are needed for the public jobs API as per user requirements

ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS status text DEFAULT 'published';
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS company_slug text;

-- Create index for faster lookups by company_slug and status
CREATE INDEX IF NOT EXISTS idx_jobs_company_slug_status ON public.jobs(company_slug, status);

-- Update existing jobs: set company_slug from company name if null
UPDATE public.jobs 
SET company_slug = lower(regexp_replace(company, '\s+', '-', 'g'))
WHERE company_slug IS NULL;
