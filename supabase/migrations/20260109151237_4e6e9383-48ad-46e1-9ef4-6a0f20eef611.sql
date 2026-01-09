-- Add application_url column to jobs table for external redirect
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS application_url TEXT;

-- Add a comment to document purpose
COMMENT ON COLUMN public.jobs.application_url IS 'External URL where applicants will be redirected to apply';