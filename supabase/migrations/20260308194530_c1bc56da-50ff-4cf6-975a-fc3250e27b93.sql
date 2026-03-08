
-- Drop the problematic trigger first
DROP TRIGGER IF EXISTS trg_check_badges ON public.profiles;

-- Recreate the function to avoid infinite recursion by checking if badges actually changed
CREATE OR REPLACE FUNCTION public.check_and_award_badges()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  badge_rec RECORD;
  current_val integer;
  old_badge_count integer;
  new_badge_count integer;
BEGIN
  -- Skip if this update is only changing badges_earned (prevents recursion)
  IF TG_OP = 'UPDATE' AND 
     OLD.xp = NEW.xp AND 
     OLD.level = NEW.level AND 
     OLD.completed_labs = NEW.completed_labs AND 
     OLD.streak_days = NEW.streak_days THEN
    RETURN NEW;
  END IF;

  FOR badge_rec IN SELECT * FROM public.badges LOOP
    CASE badge_rec.condition_type
      WHEN 'xp' THEN current_val := COALESCE(NEW.xp, 0);
      WHEN 'level' THEN current_val := COALESCE(NEW.level, 0);
      WHEN 'completed_labs' THEN current_val := COALESCE(NEW.completed_labs, 0);
      WHEN 'streak_days' THEN current_val := COALESCE(NEW.streak_days, 0);
      WHEN 'badges_earned' THEN CONTINUE;
      WHEN 'paths_completed' THEN CONTINUE; -- handled by separate trigger
      ELSE CONTINUE;
    END CASE;

    IF current_val >= badge_rec.condition_value THEN
      INSERT INTO public.user_badges (user_id, badge_id)
      VALUES (NEW.user_id, badge_rec.id)
      ON CONFLICT (user_id, badge_id) DO NOTHING;
    END IF;
  END LOOP;

  -- Update badges_earned count
  SELECT COUNT(*) INTO new_badge_count FROM public.user_badges WHERE user_id = NEW.user_id;
  
  IF new_badge_count != COALESCE(NEW.badges_earned, 0) THEN
    NEW.badges_earned := new_badge_count;
  END IF;

  RETURN NEW;
END;
$$;

-- Use BEFORE UPDATE so we can modify NEW directly (no recursive UPDATE needed)
CREATE TRIGGER trg_check_badges
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.check_and_award_badges();
