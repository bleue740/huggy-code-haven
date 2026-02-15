
-- Fix infinite recursion in projects RLS policy
-- The bug: project_collaborators.project_id = project_collaborators.id (self-reference)
-- Should be: project_collaborators.project_id = projects.id

DROP POLICY IF EXISTS "Collaborators can view shared projects" ON public.projects;

CREATE POLICY "Collaborators can view shared projects"
ON public.projects
FOR SELECT
USING (
  (auth.uid() = user_id)
  OR
  (EXISTS (
    SELECT 1 FROM project_collaborators pc
    WHERE pc.project_id = projects.id
    AND pc.user_id = auth.uid()
  ))
);
