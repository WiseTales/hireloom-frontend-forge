-- Add missing profile fields
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS headline TEXT,
ADD COLUMN IF NOT EXISTS cover_photo_url TEXT,
ADD COLUMN IF NOT EXISTS profile_completion INTEGER DEFAULT 0;

-- Create saved articles table
CREATE TABLE IF NOT EXISTS public.saved_articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.saved_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can save articles"
ON public.saved_articles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their saved articles"
ON public.saved_articles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can unsave articles"
ON public.saved_articles
FOR DELETE
USING (auth.uid() = user_id);

-- Create hashtag followers table
CREATE TABLE IF NOT EXISTS public.hashtag_followers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  hashtag_id UUID NOT NULL REFERENCES public.hashtags(id) ON DELETE CASCADE,
  followed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.hashtag_followers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can follow hashtags"
ON public.hashtag_followers
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view followed hashtags"
ON public.hashtag_followers
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can unfollow hashtags"
ON public.hashtag_followers
FOR DELETE
USING (auth.uid() = user_id);

-- Add article comments table
CREATE TABLE IF NOT EXISTS public.article_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.article_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view article comments"
ON public.article_comments
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create article comments"
ON public.article_comments
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own article comments"
ON public.article_comments
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own article comments"
ON public.article_comments
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for article comments updated_at
CREATE TRIGGER update_article_comments_updated_at
BEFORE UPDATE ON public.article_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();