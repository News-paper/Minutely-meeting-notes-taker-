
CREATE TABLE public.meetings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  meeting_date DATE NOT NULL DEFAULT CURRENT_DATE,
  category TEXT NOT NULL DEFAULT 'Other',
  username TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.minutes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE UNIQUE,
  content JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.minutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read meetings" ON public.meetings FOR SELECT USING (true);
CREATE POLICY "public insert meetings" ON public.meetings FOR INSERT WITH CHECK (true);
CREATE POLICY "public update meetings" ON public.meetings FOR UPDATE USING (true);
CREATE POLICY "public delete meetings" ON public.meetings FOR DELETE USING (true);

CREATE POLICY "public read minutes" ON public.minutes FOR SELECT USING (true);
CREATE POLICY "public insert minutes" ON public.minutes FOR INSERT WITH CHECK (true);
CREATE POLICY "public update minutes" ON public.minutes FOR UPDATE USING (true);
CREATE POLICY "public delete minutes" ON public.minutes FOR DELETE USING (true);

CREATE POLICY "public read insights" ON public.insights FOR SELECT USING (true);
CREATE POLICY "public insert insights" ON public.insights FOR INSERT WITH CHECK (true);
CREATE POLICY "public update insights" ON public.insights FOR UPDATE USING (true);
CREATE POLICY "public delete insights" ON public.insights FOR DELETE USING (true);

CREATE INDEX idx_meetings_date ON public.meetings(meeting_date DESC, created_at DESC);
CREATE INDEX idx_insights_meeting ON public.insights(meeting_id, created_at);
