# Testing Guide - HireLoom Multi-Tenant Job Posting System

This guide will walk you through testing the complete multi-tenant job posting system.

## Quick Start Test

### 1. View the Homepage

Visit: `http://localhost:3000`

You should see:
- Welcome page with two main sections
- Links to HR dashboard (Sign In/Sign Up)
- Links to test company career pages

### 2. Explore Public Career Pages

Visit these URLs to view pre-seeded job postings:

1. **NexaCore Technologies**
   - URL: `http://localhost:3000/careers/nexacore-technologies`
   - Expected: 3 job postings (Senior Software Engineer, Product Manager, DevOps Engineer)

2. **Acme Corporation**
   - URL: `http://localhost:3000/careers/acme-corporation`
   - Expected: 2 job postings (Full Stack Developer, UX Designer)

3. **Future Labs Inc**
   - URL: `http://localhost:3000/careers/future-labs-inc`
   - Expected: 3 job postings (Machine Learning Engineer, Data Scientist, Research Scientist)

### 3. Test Invalid Slug

Visit: `http://localhost:3000/careers/invalid-company`

Expected: 404 Not Found page

## Complete HR Workflow Test

### Step 1: Create an HR Account

1. Go to: `http://localhost:3000/signup`

2. Fill in the form:
   ```
   Email: hr@nexacore.com
   Password: testpass123
   Company ID: 11111111-1111-1111-1111-111111111111
   ```

3. Click "Sign Up"

4. Expected result:
   - "Account created successfully!" message
   - Automatic redirect to `/dashboard`

### Step 2: Verify Dashboard Access

After successful signup, you should see:
- Navigation bar with "HR Dashboard" title
- Company name "NexaCore Technologies" displayed
- Job posting form on the left
- List of existing jobs on the right
- Public career page link at the bottom

### Step 3: Create a New Job Posting

1. In the "Post New Job" form, enter:
   ```
   Job Title: Frontend Developer
   Location: Austin, TX (Remote)
   Description: We're looking for a talented frontend developer with React experience to join our growing team.
   ```

2. Click "Publish Job"

3. Expected result:
   - Form clears
   - New job appears in the job list immediately
   - Green "Active" badge displayed

### Step 4: Verify Job Appears on Career Page

1. In the dashboard, find the "Your Public Career Page" section
2. Click "View Page" button
3. Expected result:
   - Opens career page in new tab
   - Your new "Frontend Developer" job is visible
   - Listed alongside other NexaCore jobs

### Step 5: Test Job Management

**Toggle Job Status:**
1. In the dashboard, find your "Frontend Developer" job
2. Click "Deactivate"
3. Expected result:
   - Badge changes to gray "Inactive"
   - Button text changes to "Activate"

4. Visit the career page again
5. Expected result:
   - "Frontend Developer" job is no longer visible
   - Other active jobs still show

6. Return to dashboard and click "Activate"
7. Expected result:
   - Job becomes active again
   - Appears on career page

**Delete Job:**
1. Click "Delete" button
2. Confirm deletion in the popup
3. Expected result:
   - Job removed from list
   - No longer appears on career page

### Step 6: Test Multi-Tenancy Isolation

1. While still logged in as NexaCore HR:
   - Visit: `http://localhost:3000/careers/acme-corporation`
   - Expected: You see Acme's jobs only, NOT your NexaCore jobs

2. Create another job in the dashboard
   - Expected: It only appears on NexaCore's page
   - Does NOT appear on Acme's or Future Labs' pages

### Step 7: Test Sign Out

1. Click "Sign Out" in the navigation
2. Expected result:
   - Redirected to `/login`
   - Cannot access `/dashboard` without authentication

### Step 8: Test Sign In

1. Go to: `http://localhost:3000/login`
2. Enter credentials:
   ```
   Email: hr@nexacore.com
   Password: testpass123
   ```
3. Click "Sign In"
4. Expected result:
   - Redirected to `/dashboard`
   - Can see all your previously created jobs

## Testing Multi-Company Scenario

### Create Second HR Account (Acme)

1. Sign out if currently logged in
2. Go to: `http://localhost:3000/signup`
3. Create account:
   ```
   Email: hr@acme.com
   Password: testpass123
   Company ID: 22222222-2222-2222-2222-222222222222
   ```
4. Expected result:
   - Dashboard shows "Acme Corporation"
   - See only Acme's existing jobs
   - Cannot see NexaCore jobs

### Post Job as Acme HR

1. Create job:
   ```
   Title: Marketing Manager
   Location: Chicago, IL
   Description: Lead our marketing team...
   ```
2. Expected result:
   - Job appears on Acme's career page
   - Does NOT appear on NexaCore's career page

### Verify Complete Isolation

1. Visit all three career pages:
   - NexaCore: Shows only NexaCore jobs
   - Acme: Shows only Acme jobs
   - Future Labs: Shows only Future Labs jobs

## Testing Security & RLS

### Test 1: Unauthenticated Access

1. Open incognito/private browsing window
2. Try to visit: `http://localhost:3000/dashboard`
3. Expected: Redirected to `/login`

### Test 2: Direct Database Access Protection

With RLS enabled, even if someone gets database credentials:
- HR users can only see/edit jobs for their company
- Public users can only see active jobs
- No cross-company data leakage

### Test 3: URL Manipulation

1. While logged in as NexaCore HR
2. Try to manually change company_id in browser dev tools
3. Expected: RLS policies prevent unauthorized access

## Edge Cases to Test

### Empty Company

Visit a valid company with no jobs:
1. Sign up as HR for Future Labs: `33333333-3333-3333-3333-333333333333`
2. Delete all existing jobs
3. Visit career page
4. Expected: "No open positions currently" message

### Long Job Descriptions

1. Create a job with 500+ word description
2. Expected: Displays properly on dashboard
3. Career page shows truncated version with line-clamp

### Special Characters in Job Fields

1. Create job with title: "Senior C++ Developer (Remote)"
2. Create job with location: "São Paulo, Brazil"
3. Expected: All characters display correctly

## Performance Testing

### Page Load Times

Expected performance:
- Homepage: < 500ms
- Career page: < 1s
- Dashboard: < 1.5s (authenticated)

### Database Queries

Each page should make minimal queries:
- Career page: 2 queries (company lookup + jobs)
- Dashboard: 2 queries (profile + jobs)

## Test Checklist

- [ ] Homepage loads correctly
- [ ] All three test career pages display jobs
- [ ] 404 page shows for invalid slugs
- [ ] HR signup works
- [ ] HR login works
- [ ] Dashboard displays correct company
- [ ] Job creation works
- [ ] Jobs appear on career page immediately
- [ ] Job activation/deactivation works
- [ ] Job deletion works
- [ ] Multi-tenant isolation verified
- [ ] Sign out works
- [ ] Unauthenticated users redirected
- [ ] Public career pages accessible without login
- [ ] No cross-company data visible
- [ ] UI responsive on mobile

## Troubleshooting

### Jobs Not Appearing

Check:
1. Is the job marked as `is_active: true`?
2. Is the `company_id` correct?
3. Clear browser cache and refresh

### Authentication Issues

Check:
1. Are environment variables set correctly?
2. Is Supabase service running?
3. Clear cookies and try again

### Build Errors

Check:
1. Run `npm install` to ensure all dependencies installed
2. Verify `.env.local` exists with correct values
3. Run `npm run build` to check for errors

## Success Criteria

All tests pass if:
- ✅ HR users can sign up and create accounts
- ✅ Jobs are posted successfully
- ✅ Jobs appear only on the correct company's page
- ✅ No cross-company data leakage
- ✅ Public users can view career pages
- ✅ Invalid slugs return 404
- ✅ Authentication works properly
- ✅ UI is responsive and polished
