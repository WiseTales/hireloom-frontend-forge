-- Drop existing foreign keys if they exist (they might be pointing to wrong tables)
ALTER TABLE public.group_posts
DROP CONSTRAINT IF EXISTS group_posts_user_id_fkey;

ALTER TABLE public.reports
DROP CONSTRAINT IF EXISTS reports_reporter_id_fkey;

ALTER TABLE public.reports
DROP CONSTRAINT IF EXISTS reports_reviewed_by_fkey;

-- Recreate foreign key constraints properly
ALTER TABLE public.group_posts
ADD CONSTRAINT group_posts_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;

ALTER TABLE public.reports
ADD CONSTRAINT reports_reporter_id_fkey 
FOREIGN KEY (reporter_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;

ALTER TABLE public.reports
ADD CONSTRAINT reports_reviewed_by_fkey 
FOREIGN KEY (reviewed_by) 
REFERENCES public.profiles(id) 
ON DELETE SET NULL;