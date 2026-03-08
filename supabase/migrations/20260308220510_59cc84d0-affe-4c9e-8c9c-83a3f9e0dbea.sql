CREATE POLICY "Users can join unowned companies"
ON public.company_users
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND NOT EXISTS (
    SELECT 1 FROM public.company_users cu WHERE cu.company_id = company_users.company_id
  )
);