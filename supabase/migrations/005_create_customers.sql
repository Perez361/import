-- Create customers table
CREATE TABLE customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID REFERENCES importers(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  full_name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  contact TEXT NOT NULL,
  email TEXT NOT NULL,
  location TEXT NOT NULL,
  shipping_address TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public customers profile for authenticated users" ON customers FOR SELECT 
  USING (true);

CREATE POLICY "Users can insert their own customer profile" ON customers FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own customer profile" ON customers FOR UPDATE 
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own customer profile" ON customers FOR DELETE 
  USING (auth.uid() = user_id);

CREATE POLICY "Store owners can view their customers" ON customers FOR SELECT
  USING (EXISTS (SELECT 1 FROM importers WHERE id = store_id AND auth.uid() = importers.id));

