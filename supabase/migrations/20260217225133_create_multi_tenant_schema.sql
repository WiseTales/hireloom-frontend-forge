/*
  # Multi-Tenant Job Posting System Schema

  ## Overview
  This migration creates a multi-tenant job posting system where companies can manage their own job listings,
  and each company has a unique slug for their public career page.

  ## Tables Created

  1. **companies**
     - `id` (uuid, primary key) - Unique identifier for each company
     - `name` (text, required) - Company name
     - `slug` (text, unique, indexed) - URL-safe slug for company career pages
     - `created_at` (timestamptz) - Creation timestamp

  2. **profiles**
     - `id` (uuid, primary key, references auth.users) - User ID from Supabase Auth
     - `company_id` (uuid, references companies.id) - Associated company
     - `role` (text) - User role: 'hr' or 'admin'
     - `created_at` (timestamptz) - Creation timestamp

  3. **jobs**
     - `id` (uuid, primary key) - Unique identifier for each job
     - `company_id` (uuid, references companies.id) - Associated company
     - `title` (text) - Job title
     - `description` (text) - Job description
     - `location` (text) - Job location
     - `is_active` (boolean, default true) - Whether job is currently active
     - `created_at` (timestamptz) - Creation timestamp

  ## Security
  - RLS enabled on all tables
  - HR users can only manage jobs for their company
  - Public users can only view active jobs
  - Profiles are linked to auth.users for automatic user management

  ## Notes
  - Slug uniqueness is enforced at the database level
  - All timestamps use timestamptz for timezone awareness
  - Foreign key constraints ensure referential integrity
*/

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create index on slug for fast lookups
CREATE INDEX IF NOT EXISTS idx_companies_slug ON companies(slug);

-- Create profiles table (links auth.users to companies)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('hr', 'admin')),
  created_at timestamptz DEFAULT now()
);

-- Create index on company_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_profiles_company_id ON profiles(company_id);

-- Create jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  location text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_jobs_company_id ON jobs(company_id);
CREATE INDEX IF NOT EXISTS idx_jobs_is_active ON jobs(is_active);
CREATE INDEX IF NOT EXISTS idx_jobs_company_active ON jobs(company_id, is_active);

-- Enable Row Level Security
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for companies table
-- Public can read all companies (needed for career page lookups)
CREATE POLICY "Anyone can view companies"
  ON companies FOR SELECT
  TO public
  USING (true);

-- Only authenticated users can insert companies (admins would do this)
CREATE POLICY "Authenticated users can insert companies"
  ON companies FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for profiles table
-- Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- RLS Policies for jobs table
-- Public users can view active jobs
CREATE POLICY "Anyone can view active jobs"
  ON jobs FOR SELECT
  TO public
  USING (is_active = true);

-- Authenticated users can view all jobs from their company
CREATE POLICY "HR can view company jobs"
  ON jobs FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- HR users can insert jobs only for their company
CREATE POLICY "HR can insert jobs for their company"
  ON jobs FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- HR users can update jobs only for their company
CREATE POLICY "HR can update company jobs"
  ON jobs FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- HR users can delete jobs only for their company
CREATE POLICY "HR can delete company jobs"
  ON jobs FOR DELETE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );
