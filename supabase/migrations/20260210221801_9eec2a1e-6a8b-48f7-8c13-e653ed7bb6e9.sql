
-- Add hiring_manager to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'hiring_manager';

-- Update existing role entries: map old roles to new ones
-- job_seeker, interviewer, employee are no longer valid - we'll leave them for now
-- but the app will only use admin, recruiter, hiring_manager going forward
