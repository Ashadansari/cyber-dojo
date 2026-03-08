
-- Badges definition table
CREATE TABLE public.badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  icon text NOT NULL DEFAULT 'award',
  category text NOT NULL DEFAULT 'general',
  condition_type text NOT NULL,
  condition_value integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

-- User earned badges
CREATE TABLE public.user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  badge_id uuid NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at timestamptz DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- RLS
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- Everyone can view badges
CREATE POLICY "Badges viewable by everyone" ON public.badges FOR SELECT USING (true);

-- Users can view their own earned badges
CREATE POLICY "Users can view own badges" ON public.user_badges FOR SELECT USING (auth.uid() = user_id);

-- Users can insert own badges (for the award function)
CREATE POLICY "Users can insert own badges" ON public.user_badges FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to check and award badges after profile updates
CREATE OR REPLACE FUNCTION public.check_and_award_badges()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  badge_rec RECORD;
  current_val integer;
BEGIN
  FOR badge_rec IN SELECT * FROM public.badges LOOP
    -- Determine current value based on condition_type
    CASE badge_rec.condition_type
      WHEN 'xp' THEN current_val := COALESCE(NEW.xp, 0);
      WHEN 'level' THEN current_val := COALESCE(NEW.level, 0);
      WHEN 'completed_labs' THEN current_val := COALESCE(NEW.completed_labs, 0);
      WHEN 'streak_days' THEN current_val := COALESCE(NEW.streak_days, 0);
      WHEN 'badges_earned' THEN CONTINUE; -- skip to avoid recursion
      ELSE CONTINUE;
    END CASE;

    -- Award badge if condition met and not already earned
    IF current_val >= badge_rec.condition_value THEN
      INSERT INTO public.user_badges (user_id, badge_id)
      VALUES (NEW.user_id, badge_rec.id)
      ON CONFLICT (user_id, badge_id) DO NOTHING;
    END IF;
  END LOOP;

  -- Update badges_earned count
  UPDATE public.profiles
  SET badges_earned = (SELECT COUNT(*) FROM public.user_badges WHERE user_id = NEW.user_id)
  WHERE user_id = NEW.user_id;

  RETURN NEW;
END;
$$;

-- Trigger on profile updates
CREATE TRIGGER trg_check_badges
AFTER UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.check_and_award_badges();

-- Also check badges when path progress is updated (for path completion badges)
CREATE OR REPLACE FUNCTION public.check_path_badges()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  paths_completed integer;
  badge_rec RECORD;
BEGIN
  -- Count fully completed paths
  SELECT COUNT(*) INTO paths_completed
  FROM public.user_path_progress upp
  JOIN public.learning_paths lp ON lp.id = upp.learning_path_id
  WHERE upp.user_id = NEW.user_id
    AND upp.completed_modules >= lp.total_modules;

  FOR badge_rec IN SELECT * FROM public.badges WHERE condition_type = 'paths_completed' LOOP
    IF paths_completed >= badge_rec.condition_value THEN
      INSERT INTO public.user_badges (user_id, badge_id)
      VALUES (NEW.user_id, badge_rec.id)
      ON CONFLICT (user_id, badge_id) DO NOTHING;
    END IF;
  END LOOP;

  -- Update badges count
  UPDATE public.profiles
  SET badges_earned = (SELECT COUNT(*) FROM public.user_badges WHERE user_id = NEW.user_id)
  WHERE user_id = NEW.user_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_check_path_badges
AFTER UPDATE ON public.user_path_progress
FOR EACH ROW
EXECUTE FUNCTION public.check_path_badges();
