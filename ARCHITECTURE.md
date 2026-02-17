# Architecture Documentation - HireLoom Multi-Tenant Job Posting System

## Overview

HireLoom is a production-ready multi-tenant job posting platform that enables multiple companies to manage their own job listings through a unified system, with each company having its own public career page accessible via a unique slug.

## Core Principles

1. **Path-Based Multi-Tenancy**: No subdomains required
2. **Data Isolation**: Company data completely separated via RLS
3. **Zero Configuration**: HR users auto-assigned to companies
4. **Security First**: RLS policies enforced at database level

## System Architecture

### High-Level Flow

```
┌─────────────────┐
│  Public Users   │
│  (Candidates)   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│  /careers/[company-slug]        │
│  Dynamic Public Career Page     │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Supabase Database              │
│  - RLS: Public read active jobs │
│  - Filtered by company_id       │
└─────────────────────────────────┘

┌─────────────────┐
│    HR Users     │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│  /login → /dashboard            │
│  Authenticated HR Portal        │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Supabase Database              │
│  - RLS: HR can manage own jobs  │
│  - Auto-filtered by profile     │
└─────────────────────────────────┘
```

## Database Schema

### Tables Diagram

```
┌─────────────────────┐
│     companies       │
├─────────────────────┤
│ id (PK)            │◄─────┐
│ name               │      │
│ slug (UNIQUE)      │      │
│ created_at         │      │
└─────────────────────┘      │
                             │
                             │
┌─────────────────────┐      │
│     profiles        │      │
├─────────────────────┤      │
│ id (PK, FK→users)  │      │
│ company_id (FK)    │──────┤
│ role               │      │
│ created_at         │      │
└─────────────────────┘      │
                             │
                             │
┌─────────────────────┐      │
│       jobs          │      │
├─────────────────────┤      │
│ id (PK)            │      │
│ company_id (FK)    │──────┘
│ title              │
│ description        │
│ location           │
│ is_active          │
│ created_at         │
└─────────────────────┘
```

### Relationships

- `profiles.id` → `auth.users.id` (1:1)
- `profiles.company_id` → `companies.id` (N:1)
- `jobs.company_id` → `companies.id` (N:1)

### Indexes

Optimized for common queries:
- `companies.slug` (UNIQUE, B-tree)
- `profiles.company_id` (B-tree)
- `jobs.company_id` (B-tree)
- `jobs.is_active` (B-tree)
- `jobs(company_id, is_active)` (Composite)

## Row Level Security (RLS)

### Security Model

All data access is controlled at the database level through PostgreSQL RLS policies.

### Companies Table Policies

```sql
-- Anyone can view companies (needed for slug lookup)
PUBLIC: SELECT → true

-- Authenticated users can create companies
AUTHENTICATED: INSERT → true
```

### Profiles Table Policies

```sql
-- Users can view/edit only their own profile
AUTHENTICATED: SELECT → auth.uid() = id
AUTHENTICATED: INSERT → auth.uid() = id
AUTHENTICATED: UPDATE → auth.uid() = id
```

### Jobs Table Policies

```sql
-- Public can view active jobs only
PUBLIC: SELECT → is_active = true

-- HR can view all jobs from their company
AUTHENTICATED: SELECT → company_id IN (
  SELECT company_id FROM profiles WHERE id = auth.uid()
)

-- HR can insert jobs only for their company
AUTHENTICATED: INSERT → company_id IN (
  SELECT company_id FROM profiles WHERE id = auth.uid()
)

-- HR can update/delete only their company's jobs
AUTHENTICATED: UPDATE/DELETE → company_id IN (
  SELECT company_id FROM profiles WHERE id = auth.uid()
)
```

### Security Benefits

1. **Automatic Enforcement**: Cannot be bypassed in application code
2. **Zero Trust**: Even compromised API keys cannot leak data
3. **Audit Trail**: All policies logged in Supabase
4. **Performance**: Policies evaluated at database level

## Authentication Flow

### Sign Up Flow

```
User submits signup form
    ↓
Supabase Auth creates user
    ↓
Profile record created with company_id
    ↓
User automatically associated with company
    ↓
Dashboard shows only that company's data
```

### Key Points

- Company assignment happens at profile creation
- Cannot be changed by HR user
- Immutable once set
- Enforced by database foreign keys

## Routing Architecture

### Dynamic Route Pattern

```
/careers/[companySlug]/page.tsx
```

### Route Resolution Flow

```
1. User visits /careers/nexacore-technologies
2. Next.js extracts params.companySlug = "nexacore-technologies"
3. Server component queries database:
   SELECT * FROM companies WHERE slug = 'nexacore-technologies'
4. If found: Fetch jobs for that company_id
5. If not found: Return 404
6. Render page with company-specific data
```

### Benefits

- No subdomain DNS configuration required
- Works on any hosting provider
- SEO-friendly URLs
- Easy to share links

## Component Architecture

### Page Types

1. **Server Components** (Default)
   - Career pages (`/careers/[companySlug]`)
   - Dashboard (`/dashboard`)
   - All data fetching happens server-side

2. **Client Components** (`'use client'`)
   - Forms (JobPostingForm)
   - Interactive lists (JobsList)
   - Authentication forms (Login/Signup)

### Data Flow

```
Server Component
    ↓
Fetches data via Supabase Server Client
    ↓
Passes data as props to Client Components
    ↓
Client Components handle user interactions
    ↓
Mutations trigger router.refresh()
    ↓
Server re-fetches and re-renders
```

## Multi-Tenancy Implementation

### Slug Generation

Company names are converted to URL-safe slugs:

```typescript
function generateSlug(name: string): string {
  return name
    .toLowerCase()        // "NexaCore" → "nexacore"
    .trim()               // Remove whitespace
    .replace(/[^\w\s-]/g, '')  // Remove special chars
    .replace(/[\s_-]+/g, '-')  // Spaces to hyphens
    .replace(/^-+|-+$/g, '')   // Trim hyphens
}
```

Examples:
- "NexaCore Technologies" → "nexacore-technologies"
- "Acme Corporation" → "acme-corporation"

### Data Isolation Strategy

1. **HR Dashboard**
   - Fetch user's profile → get company_id
   - All queries automatically filtered by that company_id
   - RLS prevents manual manipulation

2. **Job Creation**
   - company_id passed from authenticated profile
   - No manual selection allowed
   - RLS validates company_id matches user's company

3. **Public Career Pages**
   - Slug lookup finds company
   - Jobs filtered by company_id
   - Only active jobs shown
   - No authentication required

## Security Considerations

### Threat Model

| Threat | Mitigation |
|--------|-----------|
| SQL Injection | Supabase client uses parameterized queries |
| Cross-Company Access | RLS policies enforce company_id checks |
| Unauthorized Job Posting | RLS requires company_id match |
| Data Tampering | All mutations validated by RLS |
| Session Hijacking | Supabase Auth uses secure cookies |

### Best Practices Implemented

1. All sensitive operations require authentication
2. Company assignment cannot be changed by users
3. Public data (career pages) read-only
4. No raw SQL queries in application code
5. All inputs sanitized by React
6. CSRF protection via SameSite cookies

## Performance Optimizations

### Database

- Indexes on all foreign keys
- Composite index on (company_id, is_active)
- Slug index for fast lookups

### Next.js

- Server components for zero client JS
- Dynamic routes for on-demand rendering
- Static homepage for instant load

### Supabase

- Connection pooling enabled
- RLS policies use indexed columns
- Minimal query complexity

## Scalability

### Current Limits

- **Companies**: Unlimited
- **HR Users**: Unlimited per company
- **Jobs**: Unlimited per company
- **Concurrent Users**: Supabase free tier limits apply

### Scaling Strategy

1. **Horizontal Scaling**
   - Add more Supabase read replicas
   - Use CDN for static assets
   - Deploy to edge network (Vercel)

2. **Vertical Scaling**
   - Upgrade Supabase plan
   - Increase connection pool
   - Add caching layer

3. **Future Enhancements**
   - Redis for session caching
   - ElasticSearch for job search
   - CloudFlare for DDoS protection

## Deployment Architecture

### Production Setup

```
┌─────────────────┐
│  Vercel Edge    │ ← Users
│  Network        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Next.js App    │
│  (Server)       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Supabase       │
│  (Database)     │
└─────────────────┘
```

### Environment Variables

Required for production:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

## Monitoring & Observability

### Key Metrics to Track

1. **Application**
   - Page load times
   - Job creation rate
   - User sign-up rate

2. **Database**
   - Query performance
   - Connection pool usage
   - RLS policy evaluation time

3. **Infrastructure**
   - Uptime
   - Error rate
   - Response time

### Recommended Tools

- Vercel Analytics (built-in)
- Supabase Dashboard (query insights)
- Sentry (error tracking)

## Future Roadmap

### Phase 2 Features

- [ ] Application submission system
- [ ] Email notifications
- [ ] Advanced search filters
- [ ] Company branding customization
- [ ] Analytics dashboard
- [ ] Applicant tracking

### Phase 3 Features

- [ ] Multi-language support
- [ ] API for external integrations
- [ ] Mobile app
- [ ] AI-powered candidate matching
- [ ] Video interview integration

## Conclusion

This architecture provides a solid foundation for a multi-tenant SaaS application with:
- Strong security through database-level RLS
- Clean separation of concerns
- Scalable design patterns
- Production-ready code quality
- Excellent developer experience

The system can be easily extended with additional features while maintaining the core principles of data isolation and security.
