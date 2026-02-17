
-- Create public storage bucket for deployed builds
INSERT INTO storage.buckets (id, name, public) VALUES ('deployments', 'deployments', true);

-- RLS: anyone can read deployed files
CREATE POLICY "Public read access for deployments" ON storage.objects FOR SELECT USING (bucket_id = 'deployments');

-- RLS: authenticated users can upload builds
CREATE POLICY "Authenticated users can upload builds" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'deployments' AND auth.role() = 'authenticated');

-- RLS: authenticated users can update their builds
CREATE POLICY "Authenticated users can update builds" ON storage.objects FOR UPDATE USING (bucket_id = 'deployments' AND auth.role() = 'authenticated');

-- RLS: authenticated users can delete their builds
CREATE POLICY "Authenticated users can delete builds" ON storage.objects FOR DELETE USING (bucket_id = 'deployments' AND auth.role() = 'authenticated');

-- Add build_url column to deployments table
ALTER TABLE public.deployments ADD COLUMN build_url text;
