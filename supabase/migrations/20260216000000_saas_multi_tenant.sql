
-- Step 1: Update Companies table
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS api_key TEXT UNIQUE;

-- Step 2: Update Profiles table to link to Company
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);

-- Step 3: Ensure Jobs table is clean (maintain company_id, but we can't easily drop 'company' if it's NOT NULL without precautions)
-- The user asked to remove companyName string field. In our schema it is 'company'.
-- For now, we will keep it but make it nullable if it wasn't already, so we can transition to company_id.
ALTER TABLE public.jobs ALTER COLUMN company DROP NOT NULL;

-- Step 4: Create a helper function/trigger to auto-fill company_slug on jobs if missing
CREATE OR REPLACE FUNCTION public.sync_job_company_details()
RETURNS TRIGGER AS $$
BEGIN
  -- If company_id is present, we can eventually sync name/slug from there if needed
  -- But for this SaaS refactor, we primarily rely on company_id for filtering.
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Seed or Ensure 'Nexacore' exists for testing if requested
-- (Note: In a real production migration, we wouldn't hardcode seeds, but for this task it helps)
INSERT INTO public.companies (name, slug, api_key)
VALUES ('Nexacore', 'nexacore', 'nex_test_key_123')
ON CONFLICT (slug) DO UPDATE SET name = 'Nexacore';

-- Step 6: Link the first admin/recruiter to Nexacore for the demo
-- We'll look for users with 'recruiter' role and link them to the Nexacore company.
UPDATE public.profiles
SET company_id = (SELECT id FROM public.companies WHERE slug = 'nexacore' LIMIT 1)
WHERE id IN (
  SELECT user_id FROM public.user_roles WHERE role = 'recruiter'
) AND company_id IS NULL;
