-- Create jobs table for recruiter-posted jobs
CREATE TABLE public.jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  salary TEXT,
  type TEXT NOT NULL,
  category TEXT NOT NULL,
  posted_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for jobs table
-- Anyone (including non-authenticated) can view all jobs
CREATE POLICY "Anyone can view all jobs"
ON public.jobs
FOR SELECT
USING (true);

-- Recruiters can insert their own jobs
CREATE POLICY "Recruiters can create jobs"
ON public.jobs
FOR INSERT
WITH CHECK (
  auth.uid() = posted_by 
  AND public.has_role(auth.uid(), 'recruiter')
);

-- Recruiters can update their own jobs
CREATE POLICY "Recruiters can update their own jobs"
ON public.jobs
FOR UPDATE
USING (
  auth.uid() = posted_by 
  AND public.has_role(auth.uid(), 'recruiter')
);

-- Recruiters can delete their own jobs
CREATE POLICY "Recruiters can delete their own jobs"
ON public.jobs
FOR DELETE
USING (
  auth.uid() = posted_by 
  AND public.has_role(auth.uid(), 'recruiter')
);

-- Admins can do everything
CREATE POLICY "Admins can manage all jobs"
ON public.jobs
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_jobs_updated_at
BEFORE UPDATE ON public.jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();