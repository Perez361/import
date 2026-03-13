-- Create carts table
CREATE TABLE carts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE UNIQUE,
  store_id UUID REFERENCES importers(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create cart_items table
CREATE TABLE cart_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cart_id UUID REFERENCES carts(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER DEFAULT 1 NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(cart_id, product_id)
);

-- Enable RLS
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Cart select" ON carts FOR SELECT USING (true);
CREATE POLICY "Cart own" ON carts FOR ALL USING (auth.uid() = (SELECT user_id FROM customers c WHERE c.id = carts.customer_id));
CREATE POLICY "Store carts" ON carts FOR ALL USING (EXISTS (SELECT 1 FROM importers i WHERE i.id = carts.store_id AND auth.uid() = i.id));

CREATE POLICY "Cart items own" ON cart_items FOR ALL USING (EXISTS (SELECT 1 FROM carts c JOIN customers cu ON c.customer_id = cu.id WHERE c.id = cart_items.cart_id AND auth.uid() = cu.user_id));

