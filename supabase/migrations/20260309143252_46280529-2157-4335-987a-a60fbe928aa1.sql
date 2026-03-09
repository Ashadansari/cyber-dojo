CREATE TABLE public.chat_daily_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  usage_date date NOT NULL DEFAULT CURRENT_DATE,
  message_count integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, usage_date)
);

ALTER TABLE public.chat_daily_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chat usage"
  ON public.chat_daily_usage FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat usage"
  ON public.chat_daily_usage FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chat usage"
  ON public.chat_daily_usage FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);