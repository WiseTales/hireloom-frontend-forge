# HireLoom - Multi-Tenant Job Posting System

A production-ready multi-tenant job posting platform built with Next.js 15 (App Router) and Supabase.

## Features

- **Path-Based Multi-Tenancy**: Each company gets a unique career page at `/careers/[company-slug]`
- **Secure Authentication**: Supabase Auth with email/password
- **Row Level Security**: Automatic data isolation per company
- **HR Dashboard**: Manage job postings with real-time updates
- **Public Career Pages**: Beautiful, responsive job listings for candidates
- **Slug Generation**: Automatic URL-safe slug creation from company names

## Architecture

### Tech Stack
- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Backend**: Supabase (PostgreSQL, Auth, RLS)
- **Styling**: Tailwind CSS
- **Deployment**: Vercel-ready

### Database Schema

#### Tables

1. **companies**
   - `id` (uuid, primary key)
   - `name` (text, required)
   - `slug` (text, unique, indexed)
   - `created_at` (timestamptz)

2. **profiles**
   - `id` (uuid, references auth.users)
   - `company_id` (uuid, references companies)
   - `role` (text: 'hr' | 'admin')
   - `created_at` (timestamptz)

3. **jobs**
   - `id` (uuid, primary key)
   - `company_id` (uuid, references companies)
   - `title` (text)
   - `description` (text)
   - `location` (text)
   - `is_active` (boolean, default true)
   - `created_at` (timestamptz)

### Row Level Security

All tables have RLS enabled with the following policies:

- **Public users**: Can only view active jobs
- **HR users**: Can only manage jobs for their assigned company
- **Authentication**: Required for all write operations

## Setup Instructions

### 1. Prerequisites

- Node.js 18+ installed
- Supabase account
- Git

### 2. Database Setup

The database migrations have already been applied to your Supabase instance:

- ✅ Multi-tenant schema created
- ✅ RLS policies configured
- ✅ Test data seeded

**Test Companies Available:**
- NexaCore Technologies (`/careers/nexacore-technologies`)
- Acme Corporation (`/careers/acme-corporation`)
- Future Labs Inc (`/careers/future-labs-inc`)

### 3. Environment Variables

Create a `.env.local` file:

```bash
cp .env.local.example .env.local
```

Add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Usage Guide

### For HR Users

1. **Create an Account**
   - Go to `/signup`
   - Enter email and password
   - Use company ID: `11111111-1111-1111-1111-111111111111` (NexaCore)
   - Click "Sign Up"

2. **Sign In**
   - Go to `/login`
   - Enter your credentials
   - Click "Sign In"

3. **Post a Job**
   - You'll be redirected to `/dashboard`
   - Fill out the job posting form:
     - Job Title (e.g., "Senior Software Engineer")
     - Location (e.g., "San Francisco, CA (Remote)")
     - Description
   - Click "Publish Job"
   - Job appears immediately on your company's career page

4. **Manage Jobs**
   - View all your company's jobs in the dashboard
   - Toggle jobs active/inactive
   - Delete jobs
   - Jobs are automatically isolated to your company

### For Candidates

1. **View Career Pages**
   - Visit `/careers/[company-slug]`
   - Example: `/careers/nexacore-technologies`
   - Browse available positions
   - Click "Apply Now" (currently a placeholder)

### For Admins

**Creating a New Company:**

```sql
-- Connect to your Supabase SQL Editor and run:
INSERT INTO companies (name, slug)
VALUES ('Your Company Name', 'your-company-name');
```

The slug will be used in the URL: `/careers/your-company-name`

## Slug Generation Logic

Company names are automatically converted to URL-safe slugs:

```typescript
"NexaCore Technologies" → "nexacore-technologies"
"Acme Corporation"      → "acme-corporation"
"Future Labs Inc"       → "future-labs-inc"
```

Rules:
- Convert to lowercase
- Trim whitespace
- Replace spaces with hyphens
- Remove special characters
- Enforce uniqueness at DB level

## Multi-Tenant Isolation

### How It Works

1. **Company Assignment**
   - HR users are linked to companies via `profiles.company_id`
   - This relationship is established during signup

2. **Automatic Data Isolation**
   - When HR posts a job, it's automatically tagged with their `company_id`
   - RLS policies ensure HR can only see/edit their company's jobs
   - Public users only see active jobs from any company

3. **Dynamic Routing**
   - Career pages use Next.js dynamic routes: `[companySlug]`
   - Company lookup by slug happens server-side
   - 404 returned for invalid slugs

## Security Features

- Row Level Security (RLS) on all tables
- Automatic authentication via Supabase Auth
- Company-scoped data access
- SQL injection prevention via Supabase client
- XSS protection via React
- CSRF protection via SameSite cookies

## Project Structure

```
├── app/
│   ├── careers/[companySlug]/    # Public career pages
│   ├── dashboard/                # HR dashboard
│   ├── login/                    # Authentication
│   ├── signup/                   # Registration
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Homepage
│   └── not-found.tsx             # 404 page
├── components/
│   ├── JobPostingForm.tsx        # Job creation form
│   ├── JobsList.tsx              # Job management
│   └── LogoutButton.tsx          # Sign out
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Browser client
│   │   └── server.ts             # Server client
│   ├── types/
│   │   └── database.ts           # TypeScript types
│   └── utils/
│       └── slug.ts               # Slug generation
└── supabase/
    └── migrations/               # Database migrations
```

## Testing the System

### Test User Flow

1. **Create Test HR Account**
   ```
   Email: test@nexacore.com
   Password: test123456
   Company ID: 11111111-1111-1111-1111-111111111111
   ```

2. **Post a Test Job**
   ```
   Title: Test Engineer
   Location: Remote
   Description: This is a test job posting
   ```

3. **View on Career Page**
   - Visit: `/careers/nexacore-technologies`
   - Your job should appear instantly

4. **Test Multi-Tenancy**
   - Job only visible on NexaCore's page
   - Not visible on other companies' pages

## License

MIT
