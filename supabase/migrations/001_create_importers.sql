-- ============================================================
-- Migration 001: Create importers table
-- ============================================================

CREATE TABLE IF NOT EXISTS public.importers (
  id            uuid        NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         text,
  business_name text,
  full_name     text,
  username      text        UNIQUE,
  phone         text,
  location      text,
  store_slug    text        UNIQUE,
  created_at    timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE public.importers ENABLE ROW LEVEL SECURITY;

-- Own profile access
CREATE POLICY "Importers can view own profile"   ON public.importers FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Importers can insert own profile" ON public.importers FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Importers can update own profile" ON public.importers FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Importers can delete own profile" ON public.importers FOR DELETE USING (auth.uid() = id);

-- Public read — needed for customer storefront to look up store by slug
CREATE POLICY "Public can view importers" ON public.importers FOR SELECT USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS importers_username_idx   ON public.importers (username);
CREATE INDEX IF NOT EXISTS importers_store_slug_idx ON public.importers (LOWER(store_slug));
CREATE INDEX IF NOT EXISTS importers_created_at_idx ON public.importers (created_at);

-- ============================================================
-- Trigger: auto-insert importer row on email signup
-- Guards against customer signups (which send customer=true in metadata)
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Skip customer signups
  IF (NEW.raw_user_meta_data->>'customer') = 'true' THEN
    RETURN NEW;
  END IF;

  -- Skip if no importer metadata (e.g. OAuth without metadata, phone OTP handled separately)
  IF NEW.raw_user_meta_data->>'business_name' IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.importers (id, email, business_name, full_name, username, phone, location, store_slug)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'business_name',
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'location',
    COALESCE(
      LOWER(NEW.raw_user_meta_data->>'username'),
      LOWER(SPLIT_PART(NEW.email, '@', 1))
    )
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
