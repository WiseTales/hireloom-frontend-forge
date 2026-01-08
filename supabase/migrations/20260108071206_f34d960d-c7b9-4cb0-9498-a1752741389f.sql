-- Fix: ensure uuid comparisons use uuid types

CREATE POLICY "lovable_resumes_read_job_access"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'resumes'
  AND EXISTS (
    SELECT 1
    FROM public.jobs j
    WHERE j.id::text = (storage.foldername(name))[1]
      AND (
        j.posted_by = auth.uid()
        OR (j.company_id IS NOT NULL AND public.is_company_member(j.company_id, auth.uid()))
      )
  )
);

CREATE POLICY "lovable_resumes_read_own_profile"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'resumes'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
