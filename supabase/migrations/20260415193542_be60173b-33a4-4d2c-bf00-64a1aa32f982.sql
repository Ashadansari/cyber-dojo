
-- Create avatars storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Allow anyone to view avatars
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Users can upload their own avatar (folder = user_id)
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can update their own avatar
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can delete their own avatar
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Make user_lab_completions and user_badges viewable by everyone (needed for public profiles)
CREATE POLICY "Lab completions viewable by everyone"
ON public.user_lab_completions FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Users can view own completions" ON public.user_lab_completions;

CREATE POLICY "Badges viewable by everyone"
ON public.user_badges FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Users can view own badges" ON public.user_badges;

-- Make user_path_progress viewable by everyone
CREATE POLICY "Path progress viewable by everyone"
ON public.user_path_progress FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Users can view own progress" ON public.user_path_progress;

-- Make user_activity viewable by everyone (for contribution data)
CREATE POLICY "Activity viewable by everyone"
ON public.user_activity FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Users can view own activity" ON public.user_activity;
