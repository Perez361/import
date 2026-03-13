-- Create orders table
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  store_id UUID REFERENCES importers(id) ON DELETE SET NULL NOT NULL,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create order_items table
CREATE TABLE order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Orders select" ON orders FOR SELECT USING (true);
CREATE POLICY "Orders customer" ON orders FOR ALL USING (auth.uid() = (SELECT user_id FROM customers WHERE id = customer_id));
CREATE POLICY "Orders store" ON orders FOR ALL USING (EXISTS (SELECT 1 FROM importers WHERE id = store_id AND auth.uid() = importers.id));

CREATE POLICY "Order items customer" ON order_items FOR ALL USING (EXISTS (SELECT 1 FROM orders o JOIN customers c ON o.customer_id = c.id WHERE o.id = order_id AND auth.uid() = c.user_id));
CREATE POLICY "Order items store" ON order_items FOR ALL USING (EXISTS (SELECT 1 FROM orders WHERE id = order_id AND store_id = (SELECT id FROM importers WHERE id = auth.uid())));

