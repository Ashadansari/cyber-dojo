
-- Attach the existing streak trigger function to user_activity table
CREATE TRIGGER on_user_activity_streak
  AFTER INSERT ON public.user_activity
  FOR EACH ROW
  EXECUTE FUNCTION public.update_streak_on_activity();
