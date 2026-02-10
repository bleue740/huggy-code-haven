
CREATE TABLE public.community_showcases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  deploy_url TEXT NOT NULL,
  featured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '72 hours'),
  score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.community_showcases ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Anyone can view showcases"
ON public.community_showcases
FOR SELECT
USING (true);

-- Only authenticated users can insert (admin logic handled in app)
CREATE POLICY "Authenticated users can insert showcases"
ON public.community_showcases
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own
CREATE POLICY "Users can update own showcases"
ON public.community_showcases
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own
CREATE POLICY "Users can delete own showcases"
ON public.community_showcases
FOR DELETE
USING (auth.uid() = user_id);

CREATE INDEX idx_showcases_active ON public.community_showcases (expires_at DESC, score DESC);
