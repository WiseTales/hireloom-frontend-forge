export interface Company {
  id: string
  name: string
  slug: string
  created_at: string
}

export interface Profile {
  id: string
  company_id: string
  role: 'hr' | 'admin'
  created_at: string
}

export interface Job {
  id: string
  company_id: string
  title: string
  description: string
  location: string
  is_active: boolean
  created_at: string
}

export interface JobWithCompany extends Job {
  companies: Company
}
