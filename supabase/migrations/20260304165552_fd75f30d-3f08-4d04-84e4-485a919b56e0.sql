
-- Add unique constraint on user_path_progress for upsert
ALTER TABLE public.user_path_progress ADD CONSTRAINT user_path_progress_user_path_unique UNIQUE (user_id, learning_path_id);

-- Create function to calculate level from XP
CREATE OR REPLACE FUNCTION public.calculate_level(xp_total integer)
RETURNS integer
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN xp_total >= 5000 THEN 10
    WHEN xp_total >= 3500 THEN 9
    WHEN xp_total >= 2500 THEN 8
    WHEN xp_total >= 1800 THEN 7
    WHEN xp_total >= 1200 THEN 6
    WHEN xp_total >= 800 THEN 5
    WHEN xp_total >= 500 THEN 4
    WHEN xp_total >= 250 THEN 3
    WHEN xp_total >= 100 THEN 2
    ELSE 1
  END;
$$;

-- Create function to calculate rank from level
CREATE OR REPLACE FUNCTION public.calculate_rank(lvl integer)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN lvl >= 10 THEN 'Elite Hacker'
    WHEN lvl >= 8 THEN 'Cyber Ninja'
    WHEN lvl >= 6 THEN 'Exploit Dev'
    WHEN lvl >= 4 THEN 'Pentester'
    WHEN lvl >= 2 THEN 'Apprentice'
    ELSE 'Script Kiddie'
  END;
$$;

-- Create trigger to auto-update level and rank when XP changes
CREATE OR REPLACE FUNCTION public.update_level_and_rank()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.level := calculate_level(COALESCE(NEW.xp, 0));
  NEW.rank := calculate_rank(NEW.level);
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profile_level_rank
  BEFORE INSERT OR UPDATE OF xp ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_level_and_rank();
