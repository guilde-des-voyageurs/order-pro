-- Tables pour le module IVY (Inventaire)

-- Table des produits (cache Shopify)
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  shopify_id TEXT NOT NULL,
  title TEXT NOT NULL,
  handle TEXT,
  image_url TEXT,
  status TEXT DEFAULT 'active',
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(shop_id, shopify_id)
);

-- Table des variantes de produits
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  shopify_id TEXT NOT NULL,
  title TEXT NOT NULL,
  sku TEXT,
  option1 TEXT,
  option2 TEXT,
  option3 TEXT,
  inventory_item_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, shopify_id)
);

-- Table des niveaux d'inventaire par emplacement
CREATE TABLE IF NOT EXISTS inventory_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  location_id TEXT NOT NULL,
  quantity INTEGER DEFAULT 0,
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(variant_id, location_id)
);

-- Table des emplacements (cache Shopify)
CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  shopify_id TEXT NOT NULL,
  name TEXT NOT NULL,
  address1 TEXT,
  city TEXT,
  country TEXT,
  active BOOLEAN DEFAULT true,
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(shop_id, shopify_id)
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_products_shop_id ON products(shop_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_levels_variant_id ON inventory_levels(variant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_levels_location_id ON inventory_levels(location_id);
CREATE INDEX IF NOT EXISTS idx_locations_shop_id ON locations(shop_id);

-- RLS Policies
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- Policies pour products
CREATE POLICY "Users can view products of their shops" ON products
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_shops 
      WHERE user_shops.shop_id = products.shop_id 
      AND user_shops.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert products to their shops" ON products
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_shops 
      WHERE user_shops.shop_id = products.shop_id 
      AND user_shops.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update products of their shops" ON products
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_shops 
      WHERE user_shops.shop_id = products.shop_id 
      AND user_shops.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete products of their shops" ON products
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM user_shops 
      WHERE user_shops.shop_id = products.shop_id 
      AND user_shops.user_id = auth.uid()
    )
  );

-- Policies pour product_variants (via products)
CREATE POLICY "Users can view variants of their products" ON product_variants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM products 
      JOIN user_shops ON user_shops.shop_id = products.shop_id
      WHERE products.id = product_variants.product_id 
      AND user_shops.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert variants to their products" ON product_variants
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM products 
      JOIN user_shops ON user_shops.shop_id = products.shop_id
      WHERE products.id = product_variants.product_id 
      AND user_shops.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update variants of their products" ON product_variants
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM products 
      JOIN user_shops ON user_shops.shop_id = products.shop_id
      WHERE products.id = product_variants.product_id 
      AND user_shops.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete variants of their products" ON product_variants
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM products 
      JOIN user_shops ON user_shops.shop_id = products.shop_id
      WHERE products.id = product_variants.product_id 
      AND user_shops.user_id = auth.uid()
    )
  );

-- Policies pour inventory_levels (via product_variants -> products)
CREATE POLICY "Users can view inventory of their variants" ON inventory_levels
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM product_variants
      JOIN products ON products.id = product_variants.product_id
      JOIN user_shops ON user_shops.shop_id = products.shop_id
      WHERE product_variants.id = inventory_levels.variant_id 
      AND user_shops.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert inventory to their variants" ON inventory_levels
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM product_variants
      JOIN products ON products.id = product_variants.product_id
      JOIN user_shops ON user_shops.shop_id = products.shop_id
      WHERE product_variants.id = inventory_levels.variant_id 
      AND user_shops.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update inventory of their variants" ON inventory_levels
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM product_variants
      JOIN products ON products.id = product_variants.product_id
      JOIN user_shops ON user_shops.shop_id = products.shop_id
      WHERE product_variants.id = inventory_levels.variant_id 
      AND user_shops.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete inventory of their variants" ON inventory_levels
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM product_variants
      JOIN products ON products.id = product_variants.product_id
      JOIN user_shops ON user_shops.shop_id = products.shop_id
      WHERE product_variants.id = inventory_levels.variant_id 
      AND user_shops.user_id = auth.uid()
    )
  );

-- Policies pour locations
CREATE POLICY "Users can view locations of their shops" ON locations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_shops 
      WHERE user_shops.shop_id = locations.shop_id 
      AND user_shops.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert locations to their shops" ON locations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_shops 
      WHERE user_shops.shop_id = locations.shop_id 
      AND user_shops.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update locations of their shops" ON locations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_shops 
      WHERE user_shops.shop_id = locations.shop_id 
      AND user_shops.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete locations of their shops" ON locations
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM user_shops 
      WHERE user_shops.shop_id = locations.shop_id 
      AND user_shops.user_id = auth.uid()
    )
  );
