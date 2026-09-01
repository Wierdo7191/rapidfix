-- RapidFix Kenya — Posts Table Schema
-- Execute this in the Supabase SQL Editor (Dashboard > SQL Editor)
-- Adds database-backed blog/post support without changing the existing static blog.

-- ============================================
-- POSTS
-- ============================================
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  excerpt TEXT,
  category TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  author_id UUID REFERENCES auth.users(id),
  image_url TEXT,
  meta_description TEXT,
  meta_keywords TEXT,
  read_time TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_posts_status ON public.posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_slug ON public.posts(slug);
CREATE INDEX IF NOT EXISTS idx_posts_published_at ON public.posts(published_at);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Public can read only published posts
DROP POLICY IF EXISTS "Public can read published posts" ON public.posts;
CREATE POLICY "Public can read published posts"
  FOR SELECT USING (status = 'published');

-- Admin/superadmin can read all posts
DROP POLICY IF EXISTS "Admin can read all posts" ON public.posts;
CREATE POLICY "Admin can read all posts"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
    )
  );

-- Admin/superadmin can insert posts
DROP POLICY IF EXISTS "Admin can insert posts" ON public.posts;
CREATE POLICY "Admin can insert posts"
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
    )
  );

-- Admin/superadmin can update posts
DROP POLICY IF EXISTS "Admin can update posts" ON public.posts;
CREATE POLICY "Admin can update posts"
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
    )
  );

-- Admin/superadmin can delete posts
DROP POLICY IF EXISTS "Admin can delete posts" ON public.posts;
CREATE POLICY "Admin can delete posts"
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin')
    )
  );

-- ============================================
-- HELPER: Updated_at trigger function
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_posts_updated_at ON public.posts;
CREATE TRIGGER set_posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
