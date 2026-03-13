-- RLS on auth.users managed by Supabase - already enabled

-- Create importers table
CREATE TABLE IF NOT EXISTS public.importers (
  id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name text NOT NULL,
  full_name text NOT NULL,
  username text NOT NULL UNIQUE,
  phone text NOT NULL,
  location text NOT NULL,
  created_at timestamptz DEFAULT timezone('utc' ::text, now()) NOT NULL
);

-- Enable RLS on importers
ALTER TABLE public.importers ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access own data
CREATE POLICY "Public importers profile for authenticated users" ON public.importers FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own importer profile" ON public.importers FOR INSERT 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own importer profile" ON public.importers FOR UPDATE 
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete own importer profile" ON public.importers FOR DELETE 
  USING (auth.uid() = id);

-- Indexes
CREATE INDEX IF NOT EXISTS importers_username_idx ON public.importers (username);
CREATE INDEX IF NOT EXISTS importers_created_at_idx ON public.importers (created_at);

-- Function to handle new user: auto-create importer from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.importers (id, business_name, full_name, username, phone, location)
  VALUES (
    NEW.id,
    (NEW.raw_user_meta_data ->> 'business_name')::text,
    (NEW.raw_user_meta_data ->> 'full_name')::text,
    (NEW.raw_user_meta_data ->> 'username')::text,
    (NEW.raw_user_meta_data ->> 'phone')::text,
    (NEW.raw_user_meta_data ->> 'location')::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

