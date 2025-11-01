-- Add foreign key constraints to link to profiles table
ALTER TABLE public.profile_views
ADD CONSTRAINT profile_views_viewer_id_fkey 
FOREIGN KEY (viewer_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.profile_views
ADD CONSTRAINT profile_views_profile_id_fkey 
FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.post_comments
ADD CONSTRAINT post_comments_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;