/*
  # Seed Test Data

  ## Overview
  This migration populates the database with test companies and jobs for development and demonstration.

  ## Data Created

  1. **Companies**
     - NexaCore Technologies (slug: nexacore-technologies)
     - Acme Corporation (slug: acme-corporation)
     - Future Labs Inc (slug: future-labs-inc)

  2. **Jobs**
     - Multiple active job postings for each company
     - Various roles (Software Engineer, Product Manager, etc.)

  ## Notes
  - Only creates data if it doesn't already exist
  - Uses predictable UUIDs for easier testing
*/

-- Insert test companies (only if they don't exist)
INSERT INTO companies (id, name, slug, created_at)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'NexaCore Technologies', 'nexacore-technologies', now()),
  ('22222222-2222-2222-2222-222222222222', 'Acme Corporation', 'acme-corporation', now()),
  ('33333333-3333-3333-3333-333333333333', 'Future Labs Inc', 'future-labs-inc', now())
ON CONFLICT (slug) DO NOTHING;

-- Insert test jobs for NexaCore Technologies
INSERT INTO jobs (company_id, title, description, location, is_active, created_at)
VALUES 
  (
    '11111111-1111-1111-1111-111111111111',
    'Senior Software Engineer',
    'We are looking for an experienced software engineer to join our core platform team. You will work on building scalable distributed systems using modern technologies.',
    'San Francisco, CA (Remote)',
    true,
    now()
  ),
  (
    '11111111-1111-1111-1111-111111111111',
    'Product Manager',
    'Join our product team to define and execute the roadmap for our flagship products. You will work closely with engineering, design, and customers.',
    'New York, NY (Hybrid)',
    true,
    now()
  ),
  (
    '11111111-1111-1111-1111-111111111111',
    'DevOps Engineer',
    'Help us build and maintain our cloud infrastructure. Experience with Kubernetes, AWS, and CI/CD pipelines required.',
    'Austin, TX (Remote)',
    true,
    now()
  )
ON CONFLICT DO NOTHING;

-- Insert test jobs for Acme Corporation
INSERT INTO jobs (company_id, title, description, location, is_active, created_at)
VALUES 
  (
    '22222222-2222-2222-2222-222222222222',
    'Full Stack Developer',
    'Build and maintain our customer-facing web applications. Experience with React, Node.js, and PostgreSQL preferred.',
    'Chicago, IL (On-site)',
    true,
    now()
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'UX Designer',
    'Create beautiful and intuitive user experiences for our enterprise software products. Portfolio required.',
    'Seattle, WA (Hybrid)',
    true,
    now()
  )
ON CONFLICT DO NOTHING;

-- Insert test jobs for Future Labs Inc
INSERT INTO jobs (company_id, title, description, location, is_active, created_at)
VALUES 
  (
    '33333333-3333-3333-3333-333333333333',
    'Machine Learning Engineer',
    'Work on cutting-edge AI/ML projects. Experience with PyTorch, TensorFlow, and large-scale data processing required.',
    'Boston, MA (Remote)',
    true,
    now()
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'Data Scientist',
    'Analyze complex datasets and build predictive models to drive business decisions. PhD in a quantitative field preferred.',
    'Remote',
    true,
    now()
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'Research Scientist',
    'Lead fundamental research in natural language processing and computer vision. Publications in top-tier conferences required.',
    'Cambridge, MA (On-site)',
    true,
    now()
  )
ON CONFLICT DO NOTHING;
