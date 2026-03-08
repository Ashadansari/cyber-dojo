
-- Fix the two functions with mutable search paths
ALTER FUNCTION public.update_updated_at_column() SET search_path TO 'public';
ALTER FUNCTION public.handle_new_user() SET search_path TO 'public';
