-- 1) Helper functions to avoid RLS recursion
create or replace function public.is_company_member(_company_id uuid, _user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.company_users
    where company_id = _company_id
      and user_id = _user_id
  )
$$;

create or replace function public.has_company_role(_company_id uuid, _user_id uuid, _role public.company_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.company_users
    where company_id = _company_id
      and user_id = _user_id
      and role = _role
  )
$$;

-- 2) Fix company_users policies (remove recursive subqueries)
drop policy if exists "Company members can view their company users" on public.company_users;
drop policy if exists "Super admins can manage company users" on public.company_users;

create policy "Company members can view their company users"
on public.company_users
for select
using (public.is_company_member(company_users.company_id, auth.uid()));

create policy "Super admins can manage company users"
on public.company_users
for all
using (public.has_company_role(company_users.company_id, auth.uid(), 'super_admin'::public.company_role))
with check (public.has_company_role(company_users.company_id, auth.uid(), 'super_admin'::public.company_role));

-- 3) Fix public_applications policies so SELECT doesn't depend on company_users joins
--    (the previous policy caused the recursion cascade)
drop policy if exists "Company members can view their job applications" on public.public_applications;

-- 4) Consolidate public insert policies (avoid WITH CHECK true)
drop policy if exists "Anyone can insert public applications" on public.public_applications;
drop policy if exists "Anyone can submit applications" on public.public_applications;

create policy "Anyone can submit applications"
on public.public_applications
for insert
with check (
  job_id is not null
  and email is not null
  and full_name is not null
  and resume_url is not null
);

-- 5) Allow job posters/admins/recruiters to update application status
--    (required for the status buttons in the ApplicationsViewer UI)
drop policy if exists "Job posters can update application status" on public.public_applications;

create policy "Job posters can update application status"
on public.public_applications
for update
using (
  exists (
    select 1
    from public.jobs
    where jobs.id = public_applications.job_id
      and jobs.posted_by = auth.uid()
  )
  or public.has_role(auth.uid(), 'admin'::public.app_role)
  or public.has_role(auth.uid(), 'recruiter'::public.app_role)
)
with check (
  exists (
    select 1
    from public.jobs
    where jobs.id = public_applications.job_id
      and jobs.posted_by = auth.uid()
  )
  or public.has_role(auth.uid(), 'admin'::public.app_role)
  or public.has_role(auth.uid(), 'recruiter'::public.app_role)
);