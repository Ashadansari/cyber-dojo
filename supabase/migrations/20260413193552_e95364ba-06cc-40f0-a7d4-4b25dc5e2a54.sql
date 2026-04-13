
-- Create follows table
CREATE TABLE public.follows (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id uuid NOT NULL,
  following_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (follower_id, following_id),
  CONSTRAINT no_self_follow CHECK (follower_id != following_id)
);

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Follows viewable by everyone" ON public.follows FOR SELECT USING (true);
CREATE POLICY "Users can follow others" ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow" ON public.follows FOR DELETE USING (auth.uid() = follower_id);

CREATE INDEX idx_follows_follower ON public.follows (follower_id);
CREATE INDEX idx_follows_following ON public.follows (following_id);

-- Create notifications table
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  type text NOT NULL DEFAULT 'general',
  title text NOT NULL,
  message text,
  related_user_id uuid,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "System can insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);

CREATE INDEX idx_notifications_user ON public.notifications (user_id, is_read, created_at DESC);

-- Trigger: notify on follow
CREATE OR REPLACE FUNCTION public.notify_on_follow()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  follower_name text;
BEGIN
  SELECT COALESCE(display_name, username, 'Someone') INTO follower_name
  FROM public.profiles WHERE user_id = NEW.follower_id;

  INSERT INTO public.notifications (user_id, type, title, message, related_user_id)
  VALUES (NEW.following_id, 'follow', 'New Follower', follower_name || ' started following you', NEW.follower_id);

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_follow_notify
AFTER INSERT ON public.follows
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_follow();

-- Trigger: notify followers on badge earned
CREATE OR REPLACE FUNCTION public.notify_followers_on_badge()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  earner_name text;
  badge_name_val text;
  follower_rec RECORD;
BEGIN
  SELECT COALESCE(display_name, username, 'A user') INTO earner_name
  FROM public.profiles WHERE user_id = NEW.user_id;

  SELECT name INTO badge_name_val FROM public.badges WHERE id = NEW.badge_id;

  FOR follower_rec IN SELECT follower_id FROM public.follows WHERE following_id = NEW.user_id LOOP
    INSERT INTO public.notifications (user_id, type, title, message, related_user_id)
    VALUES (follower_rec.follower_id, 'achievement', 'Badge Earned', earner_name || ' earned the "' || badge_name_val || '" badge', NEW.user_id);
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_badge_earned_notify
AFTER INSERT ON public.user_badges
FOR EACH ROW
EXECUTE FUNCTION public.notify_followers_on_badge();

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
