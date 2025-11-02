-- Add advanced filter columns to jobs table
ALTER TABLE jobs 
ADD COLUMN experience_level TEXT,
ADD COLUMN skills_required TEXT[],
ADD COLUMN is_remote BOOLEAN DEFAULT false;

-- Create companies table
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  website TEXT,
  industry TEXT,
  company_size TEXT,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view companies" ON companies
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create companies" ON companies
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Company creators can update their companies" ON companies
  FOR UPDATE USING (auth.uid() = created_by);

-- Create company_followers table
CREATE TABLE company_followers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  followed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, user_id)
);

ALTER TABLE company_followers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view company followers" ON company_followers
  FOR SELECT USING (true);

CREATE POLICY "Users can follow companies" ON company_followers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unfollow companies" ON company_followers
  FOR DELETE USING (auth.uid() = user_id);

-- Create job_alerts table
CREATE TABLE job_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  keywords TEXT[],
  location TEXT,
  job_type TEXT,
  experience_level TEXT,
  is_remote BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE job_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their job alerts" ON job_alerts
  FOR ALL USING (auth.uid() = user_id);

-- Add shared_post_id to posts for sharing
ALTER TABLE posts 
ADD COLUMN shared_post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
ADD COLUMN video_url TEXT,
ADD COLUMN document_url TEXT;

-- Create polls table
CREATE TABLE polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE polls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view polls" ON polls
  FOR SELECT USING (true);

CREATE POLICY "Users can create polls for their posts" ON polls
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM posts WHERE posts.id = polls.post_id AND posts.user_id = auth.uid()
    )
  );

-- Create poll_votes table
CREATE TABLE poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  option_index INTEGER NOT NULL,
  voted_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(poll_id, user_id)
);

ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view poll votes" ON poll_votes
  FOR SELECT USING (true);

CREATE POLICY "Users can vote on polls" ON poll_votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can change their vote" ON poll_votes
  FOR UPDATE USING (auth.uid() = user_id);

-- Add company_id to jobs table
ALTER TABLE jobs ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE SET NULL;

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE company_followers;
ALTER PUBLICATION supabase_realtime ADD TABLE poll_votes;