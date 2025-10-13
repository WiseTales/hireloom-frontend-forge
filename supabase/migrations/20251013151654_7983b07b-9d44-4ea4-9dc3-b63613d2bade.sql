-- Add employee_range column to jobs table
ALTER TABLE public.jobs ADD COLUMN employee_range text;

-- Create job_applications table to track candidate applications
CREATE TABLE public.job_applications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  applicant_email text NOT NULL,
  applicant_name text NOT NULL,
  applied_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(job_id, user_id)
);

-- Enable RLS on job_applications
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view applications (recruiters will filter by their jobs)
CREATE POLICY "Users can view their own applications"
ON public.job_applications
FOR SELECT
USING (auth.uid() = user_id);

-- Allow authenticated users to create applications
CREATE POLICY "Authenticated users can apply to jobs"
ON public.job_applications
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow recruiters to view applications for their jobs
CREATE POLICY "Recruiters can view applications for their jobs"
ON public.job_applications
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.jobs
    WHERE jobs.id = job_applications.job_id
    AND jobs.posted_by = auth.uid()
  )
);

-- Allow admins to view all applications
CREATE POLICY "Admins can view all applications"
ON public.job_applications
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));