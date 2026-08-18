-- RapidFix Kenya — Supabase Foundation Schema
-- Execute this in the Supabase SQL Editor (Dashboard > SQL Editor)
-- This creates the minimum tables required for the future admin system

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- REVIEWS
-- ============================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT NOT NULL,
  article_slug TEXT,
  article_title TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id)
);

-- Index for fast public queries
CREATE INDEX IF NOT EXISTS idx_reviews_status ON public.reviews(status);

-- ============================================
-- MESSAGES
-- ============================================
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  appliance TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_messages_status ON public.messages(status);

-- ============================================
-- BOOKINGS
-- ============================================
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  appliance TEXT NOT NULL,
  county TEXT NOT NULL,
  town TEXT NOT NULL,
  precise_location TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'confirmed', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);

-- ============================================
-- SITE SETTINGS
-- ============================================
CREATE TABLE IF NOT EXISTS public.site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- PROFILES (admin role extension)
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'superadmin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- REVIEWS policies
DROP POLICY IF EXISTS "Public can insert reviews" ON public.reviews;
CREATE POLICY "Public can insert reviews" ON public.reviews
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public can read approved reviews" ON public.reviews;
CREATE POLICY "Public can read approved reviews" ON public.reviews
  FOR SELECT USING (status = 'approved');

DROP POLICY IF EXISTS "Admin can read all reviews" ON public.reviews;
CREATE POLICY "Admin can read all reviews" ON public.reviews
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin can update reviews" ON public.reviews;
CREATE POLICY "Admin can update reviews" ON public.reviews
  FOR UPDATE USING (auth.role() = 'authenticated');

-- MESSAGES policies
DROP POLICY IF EXISTS "Public can insert messages" ON public.messages;
CREATE POLICY "Public can insert messages" ON public.messages
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admin can read messages" ON public.messages;
CREATE POLICY "Admin can read messages" ON public.messages
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin can update messages" ON public.messages;
CREATE POLICY "Admin can update messages" ON public.messages
  FOR UPDATE USING (auth.role() = 'authenticated');

-- BOOKINGS policies
DROP POLICY IF EXISTS "Public can insert bookings" ON public.bookings;
CREATE POLICY "Public can insert bookings" ON public.bookings
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admin can read bookings" ON public.bookings;
CREATE POLICY "Admin can read bookings" ON public.bookings
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin can update bookings" ON public.bookings;
CREATE POLICY "Admin can update bookings" ON public.bookings
  FOR UPDATE USING (auth.role() = 'authenticated');

-- SITE SETTINGS policies
DROP POLICY IF EXISTS "Public can read site settings" ON public.site_settings;
CREATE POLICY "Public can read site settings" ON public.site_settings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin can insert site settings" ON public.site_settings;
CREATE POLICY "Admin can insert site settings" ON public.site_settings
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin can update site settings" ON public.site_settings;
CREATE POLICY "Admin can update site settings" ON public.site_settings
  FOR UPDATE USING (auth.role() = 'authenticated');

-- PROFILES policies
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admin can read all profiles" ON public.profiles;
CREATE POLICY "Admin can read all profiles" ON public.profiles
  FOR SELECT USING (auth.role() = 'authenticated');

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

-- Apply trigger to reviews
DROP TRIGGER IF EXISTS set_reviews_updated_at ON public.reviews;
CREATE TRIGGER set_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Apply trigger to site_settings
DROP TRIGGER IF EXISTS set_site_settings_updated_at ON public.site_settings;
CREATE TRIGGER set_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
