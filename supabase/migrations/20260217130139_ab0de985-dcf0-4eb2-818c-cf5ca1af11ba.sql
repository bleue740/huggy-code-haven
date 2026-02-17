
-- Table for persisting user feedback on AI messages
CREATE TABLE public.message_feedback (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  message_id uuid NOT NULL,
  project_id uuid NOT NULL,
  feedback_type text NOT NULL CHECK (feedback_type IN ('up', 'down')),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Unique constraint: one feedback per user per message
ALTER TABLE public.message_feedback
  ADD CONSTRAINT message_feedback_user_message_unique UNIQUE (user_id, message_id);

-- Enable RLS
ALTER TABLE public.message_feedback ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own feedback"
  ON public.message_feedback FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own feedback"
  ON public.message_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own feedback"
  ON public.message_feedback FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own feedback"
  ON public.message_feedback FOR DELETE
  USING (auth.uid() = user_id);

-- Index for quick lookups
CREATE INDEX idx_message_feedback_project ON public.message_feedback (project_id);
CREATE INDEX idx_message_feedback_message ON public.message_feedback (message_id);
