ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS supabase_url text,
ADD COLUMN IF NOT EXISTS supabase_anon_key text,
ADD COLUMN IF NOT EXISTS firecrawl_enabled boolean DEFAULT false;