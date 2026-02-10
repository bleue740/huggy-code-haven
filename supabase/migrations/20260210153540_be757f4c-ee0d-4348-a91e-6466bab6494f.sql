-- Add unique constraint on project_id for upsert support
ALTER TABLE public.deployments ADD CONSTRAINT deployments_project_id_unique UNIQUE (project_id);