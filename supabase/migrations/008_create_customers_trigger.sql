-- Create customers trigger function (mirror importers handle_new_user)
CREATE OR REPLACE FUNCTION public.handle_new_customer_user()
RETURNS TRIGGER AS $$
DECLARE
  store_record public.importers;
  customer_meta jsonb;
BEGIN
  -- Check if this is a customer signup
  IF NEW.raw_user_meta_data ? 'customer' AND NEW.raw_user_meta_data->>'customer' = 'true' THEN
    
    -- Extract metadata
    customer_meta := NEW.raw_user_meta_data;
    
    -- Find store by store_slug (case-insensitive)
    SELECT * INTO store_record 
    FROM public.importers 
    WHERE LOWER(store_slug) = LOWER(customer_meta->>'store_slug')
    LIMIT 1;
    
    -- Fail if no store found (insert won't happen)
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Store with slug % not found for customer signup', customer_meta->>'store_slug';
    END IF;
    
    -- Insert customer profile
    INSERT INTO public.customers (
      store_id,
      user_id,
      full_name,
      username,
      contact,
      email,
      location,
      shipping_address
    ) VALUES (
      store_record.id,
      NEW.id,
      COALESCE(customer_meta->>'full_name', ''),
      COALESCE(customer_meta->>'username', ''),
      COALESCE(customer_meta->>'contact', ''),
      COALESCE(customer_meta->>'email', ''),
      COALESCE(customer_meta->>'location', ''),
      COALESCE(customer_meta->>'shipping_address', '')
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger (drop if exists)
DROP TRIGGER IF EXISTS on_auth_customer_user_created ON auth.users;
CREATE TRIGGER on_auth_customer_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_customer_user();

-- Note: This runs AFTER the existing importer trigger, so customers will take precedence if metadata matches both (unlikely)
