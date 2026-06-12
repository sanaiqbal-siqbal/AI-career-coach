-- Storage RLS for resume PDF uploads.
-- Replace 'resumes' below if your VITE_SUPABASE_STORAGE_BUCKET uses a different name.

-- Allow authenticated users to upload/read files under their own folder: {user_id}/...

DROP POLICY IF EXISTS "resumes_storage_insert_own" ON storage.objects;
DROP POLICY IF EXISTS "resumes_storage_select_own" ON storage.objects;
DROP POLICY IF EXISTS "resumes_storage_update_own" ON storage.objects;
DROP POLICY IF EXISTS "resumes_storage_delete_own" ON storage.objects;

CREATE POLICY "resumes_storage_insert_own"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'resumes'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "resumes_storage_select_own"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'resumes'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "resumes_storage_update_own"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'resumes'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'resumes'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "resumes_storage_delete_own"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'resumes'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Optional: if your bucket is ai_career_coach (see .env.example), run this block too:

DROP POLICY IF EXISTS "ai_career_coach_storage_insert_own" ON storage.objects;
DROP POLICY IF EXISTS "ai_career_coach_storage_select_own" ON storage.objects;
DROP POLICY IF EXISTS "ai_career_coach_storage_update_own" ON storage.objects;
DROP POLICY IF EXISTS "ai_career_coach_storage_delete_own" ON storage.objects;

CREATE POLICY "ai_career_coach_storage_insert_own"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'ai_career_coach'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "ai_career_coach_storage_select_own"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'ai_career_coach'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "ai_career_coach_storage_update_own"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'ai_career_coach'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'ai_career_coach'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "ai_career_coach_storage_delete_own"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'ai_career_coach'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
