
-- Function to update streak when activity is inserted
CREATE OR REPLACE FUNCTION public.update_streak_on_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  last_activity_date date;
  current_streak int;
BEGIN
  -- Get the most recent activity date before this one
  SELECT DATE(created_at) INTO last_activity_date
  FROM public.user_activity
  WHERE user_id = NEW.user_id AND id != NEW.id
  ORDER BY created_at DESC
  LIMIT 1;

  -- Get current streak
  SELECT streak_days INTO current_streak
  FROM public.profiles
  WHERE user_id = NEW.user_id;

  current_streak := COALESCE(current_streak, 0);

  IF last_activity_date IS NULL THEN
    -- First activity ever
    UPDATE public.profiles SET streak_days = 1 WHERE user_id = NEW.user_id;
  ELSIF last_activity_date = CURRENT_DATE THEN
    -- Already active today, no change
    NULL;
  ELSIF last_activity_date = CURRENT_DATE - 1 THEN
    -- Consecutive day, increment streak
    UPDATE public.profiles SET streak_days = current_streak + 1 WHERE user_id = NEW.user_id;
  ELSE
    -- Streak broken, reset to 1
    UPDATE public.profiles SET streak_days = 1 WHERE user_id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger on user_activity
CREATE TRIGGER on_activity_update_streak
AFTER INSERT ON public.user_activity
FOR EACH ROW
EXECUTE FUNCTION public.update_streak_on_activity();

-- Enable realtime for activity and profiles
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_activity;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
