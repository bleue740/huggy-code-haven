
-- Create projects table
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL DEFAULT 'New Project',
  schema JSONB DEFAULT '{}',
  code TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own projects" ON public.projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own projects" ON public.projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own projects" ON public.projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own projects" ON public.projects FOR DELETE USING (auth.uid() = user_id);

-- Create users_credits table
CREATE TABLE public.users_credits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  credits NUMERIC NOT NULL DEFAULT 100,
  lifetime_used NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.users_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own credits" ON public.users_credits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own credits" ON public.users_credits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own credits" ON public.users_credits FOR UPDATE USING (auth.uid() = user_id);

-- Create deployments table
CREATE TABLE public.deployments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_id UUID REFERENCES public.projects(id),
  slug TEXT,
  schema_snapshot JSONB DEFAULT '{}',
  url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.deployments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own deployments" ON public.deployments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own deployments" ON public.deployments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Anyone can view deployments by id" ON public.deployments FOR SELECT USING (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_users_credits_updated_at BEFORE UPDATE ON public.users_credits FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
