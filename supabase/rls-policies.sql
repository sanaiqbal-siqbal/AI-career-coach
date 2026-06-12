-- Run in Supabase SQL Editor after enabling Email auth in Authentication > Providers

-- Enable Row Level Security on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running (optional)
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_insert_own" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;
DROP POLICY IF EXISTS "resumes_select_own" ON public.resumes;
DROP POLICY IF EXISTS "resumes_insert_own" ON public.resumes;
DROP POLICY IF EXISTS "resumes_update_own" ON public.resumes;
DROP POLICY IF EXISTS "resumes_delete_own" ON public.resumes;
DROP POLICY IF EXISTS "career_paths_select_own" ON public.career_paths;
DROP POLICY IF EXISTS "career_paths_insert_own" ON public.career_paths;
DROP POLICY IF EXISTS "career_paths_update_own" ON public.career_paths;
DROP POLICY IF EXISTS "career_paths_delete_own" ON public.career_paths;
DROP POLICY IF EXISTS "interviews_select_own" ON public.interviews;
DROP POLICY IF EXISTS "interviews_insert_own" ON public.interviews;
DROP POLICY IF EXISTS "interviews_update_own" ON public.interviews;
DROP POLICY IF EXISTS "interviews_delete_own" ON public.interviews;

-- users: id must match auth.uid()
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "users_insert_own" ON public.users
  FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- resumes
CREATE POLICY "resumes_select_own" ON public.resumes
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "resumes_insert_own" ON public.resumes
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "resumes_update_own" ON public.resumes
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "resumes_delete_own" ON public.resumes
  FOR DELETE USING (user_id = auth.uid());

-- career_paths
CREATE POLICY "career_paths_select_own" ON public.career_paths
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "career_paths_insert_own" ON public.career_paths
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "career_paths_update_own" ON public.career_paths
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "career_paths_delete_own" ON public.career_paths
  FOR DELETE USING (user_id = auth.uid());

-- interviews
CREATE POLICY "interviews_select_own" ON public.interviews
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "interviews_insert_own" ON public.interviews
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "interviews_update_own" ON public.interviews
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "interviews_delete_own" ON public.interviews
  FOR DELETE USING (user_id = auth.uid());
