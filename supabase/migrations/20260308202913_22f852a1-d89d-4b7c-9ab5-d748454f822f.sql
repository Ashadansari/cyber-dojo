
-- Lab challenges table: each lab can have multiple challenges
CREATE TABLE public.lab_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id UUID REFERENCES public.labs(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL DEFAULT 'flag', -- 'flag', 'mcq', 'code_analysis'
  title TEXT NOT NULL,
  description TEXT,
  hint TEXT,
  order_index INTEGER DEFAULT 0,
  points INTEGER DEFAULT 10,
  -- For flag challenges
  flag_answer TEXT, -- the correct flag (hashed or plain for now)
  -- For MCQ challenges
  options JSONB, -- array of {id, text, is_correct}
  -- For code analysis
  code_snippet TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User challenge completions
CREATE TABLE public.user_challenge_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  challenge_id UUID REFERENCES public.lab_challenges(id) ON DELETE CASCADE NOT NULL,
  lab_id UUID REFERENCES public.labs(id) ON DELETE CASCADE NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT now(),
  attempts INTEGER DEFAULT 1,
  UNIQUE(user_id, challenge_id)
);

-- Enable RLS
ALTER TABLE public.lab_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_challenge_completions ENABLE ROW LEVEL SECURITY;

-- RLS: Everyone can view challenges
CREATE POLICY "Challenges viewable by everyone" ON public.lab_challenges
  FOR SELECT USING (true);

-- RLS: Users can view own completions
CREATE POLICY "Users can view own challenge completions" ON public.user_challenge_completions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- RLS: Users can insert own completions
CREATE POLICY "Users can insert own challenge completions" ON public.user_challenge_completions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- RLS: Users can update own completions (for attempt count)
CREATE POLICY "Users can update own challenge completions" ON public.user_challenge_completions
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
