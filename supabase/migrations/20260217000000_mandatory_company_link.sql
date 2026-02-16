
-- Step 1: Backfill company_id for existing recruiters if not already set (using nexacore as default for this demo)
DO $$
DECLARE
  v_company_id UUID;
BEGIN
  SELECT id INTO v_company_id FROM public.companies WHERE slug = 'nexacore' LIMIT 1;
  
  IF v_company_id IS NOT NULL THEN
    UPDATE public.profiles
    SET company_id = v_company_id
    WHERE company_id IS NULL;
  END IF;
END $$;

-- Step 2: Make company_id mandatory for profiles (Recruiters must have one)
-- In a real SaaS, we might allow job seekers to have NULL company_id, 
-- but the user requested: "companyId must NOT be optional".
-- To satisfy the requirement strictly:
ALTER TABLE public.profiles ALTER COLUMN company_id SET NOT NULL;

-- Step 3: Update trigger function to handle company lookup by slug from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id UUID;
  v_company_slug TEXT;
BEGIN
  v_company_slug := NEW.raw_user_meta_data->>'company_slug';
  
  -- Default to 'nexacore' if no slug provided (prevents registration failure for now)
  IF v_company_slug IS NULL THEN
    v_company_slug := 'nexacore';
  END IF;

  SELECT id INTO v_company_id FROM public.companies WHERE slug = v_company_slug LIMIT 1;

  INSERT INTO public.profiles (id, email, full_name, company_id)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    v_company_id
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'job_seeker')
  );
  
  RETURN NEW;
END;
$$;
