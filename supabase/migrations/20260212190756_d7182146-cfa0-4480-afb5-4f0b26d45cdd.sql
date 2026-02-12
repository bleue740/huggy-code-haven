
-- Project collaborators for real-time collaboration
CREATE TABLE public.project_collaborators (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  user_email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'editor',
  invited_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.project_collaborators ENABLE ROW LEVEL SECURITY;

-- Owner can see all collaborators on their projects
CREATE POLICY "Project owners can view collaborators"
ON public.project_collaborators FOR SELECT
USING (
  auth.uid() = user_id 
  OR auth.uid() = invited_by
  OR EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND user_id = auth.uid())
);

CREATE POLICY "Project owners can insert collaborators"
ON public.project_collaborators FOR INSERT
WITH CHECK (
  auth.uid() = invited_by
  AND EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND user_id = auth.uid())
);

CREATE POLICY "Project owners can delete collaborators"
ON public.project_collaborators FOR DELETE
USING (
  auth.uid() = invited_by
  OR EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND user_id = auth.uid())
);

-- Allow collaborators to view and update projects they're invited to
CREATE POLICY "Collaborators can view shared projects"
ON public.projects FOR SELECT
USING (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM public.project_collaborators WHERE project_id = id AND user_id = auth.uid())
);

-- Enable realtime for projects table (for code sync)
ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;
