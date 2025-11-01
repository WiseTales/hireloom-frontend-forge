-- Create profile_skills table
CREATE TABLE public.profile_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(profile_id, skill_name)
);

-- Create skill_endorsements table
CREATE TABLE public.skill_endorsements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id UUID NOT NULL REFERENCES public.profile_skills(id) ON DELETE CASCADE,
  endorser_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  endorsed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(skill_id, endorser_id)
);

-- Create recommendations table
CREATE TABLE public.recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recommender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  relationship TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create certifications table
CREATE TABLE public.certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  issuing_organization TEXT NOT NULL,
  issue_date DATE NOT NULL,
  expiry_date DATE,
  credential_id TEXT,
  credential_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create projects table
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  url TEXT,
  image_url TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  technologies TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profile_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_endorsements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profile_skills
CREATE POLICY "Anyone can view skills" ON public.profile_skills
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own skills" ON public.profile_skills
  FOR ALL USING (auth.uid() = profile_id);

-- RLS Policies for skill_endorsements
CREATE POLICY "Anyone can view endorsements" ON public.skill_endorsements
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can endorse skills" ON public.skill_endorsements
  FOR INSERT WITH CHECK (auth.uid() = endorser_id);

CREATE POLICY "Users can remove their endorsements" ON public.skill_endorsements
  FOR DELETE USING (auth.uid() = endorser_id);

-- RLS Policies for recommendations
CREATE POLICY "Users can view recommendations for their profile" ON public.recommendations
  FOR SELECT USING (auth.uid() = recipient_id OR auth.uid() = recommender_id);

CREATE POLICY "Users can create recommendations" ON public.recommendations
  FOR INSERT WITH CHECK (auth.uid() = recommender_id);

CREATE POLICY "Recipients can update recommendation status" ON public.recommendations
  FOR UPDATE USING (auth.uid() = recipient_id);

-- RLS Policies for certifications
CREATE POLICY "Anyone can view certifications" ON public.certifications
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own certifications" ON public.certifications
  FOR ALL USING (auth.uid() = profile_id);

-- RLS Policies for projects
CREATE POLICY "Anyone can view projects" ON public.projects
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own projects" ON public.projects
  FOR ALL USING (auth.uid() = profile_id);