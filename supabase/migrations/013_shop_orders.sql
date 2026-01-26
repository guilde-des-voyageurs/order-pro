-- Table pour stocker les commandes boutique synchronisées depuis Shopify
CREATE TABLE IF NOT EXISTS shop_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  shopify_id TEXT NOT NULL,
  order_number TEXT NOT NULL,
  
  -- Infos client
  customer_name TEXT,
  customer_email TEXT,
  
  -- Statuts
  financial_status TEXT, -- paid, pending, refunded, etc.
  fulfillment_status TEXT, -- fulfilled, unfulfilled, partial
  
  -- Montants
  total_price DECIMAL(10,2),
  subtotal_price DECIMAL(10,2),
  total_tax DECIMAL(10,2),
  currency TEXT DEFAULT 'EUR',
  
  -- Tags et notes
  tags TEXT[], -- Array de tags Shopify
  note TEXT,
  
  -- Dates Shopify
  shopify_created_at TIMESTAMPTZ,
  shopify_updated_at TIMESTAMPTZ,
  
  -- Suivi interne IVY
  is_invoiced BOOLEAN DEFAULT FALSE,
  invoiced_at TIMESTAMPTZ,
  is_archived BOOLEAN DEFAULT FALSE,
  archived_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(shop_id, shopify_id)
);

-- Table pour les articles de commande
CREATE TABLE IF NOT EXISTS shop_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES shop_orders(id) ON DELETE CASCADE,
  shopify_line_item_id TEXT,
  
  -- Infos produit
  product_id TEXT,
  variant_id TEXT,
  title TEXT NOT NULL,
  variant_title TEXT,
  sku TEXT,
  
  -- Quantités et prix
  quantity INTEGER NOT NULL DEFAULT 1,
  price DECIMAL(10,2),
  
  -- Image
  image_url TEXT,
  
  -- Suivi interne
  is_processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMPTZ,
  
  -- Métachamps (pour l'impression)
  metafields JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les recherches fréquentes
CREATE INDEX IF NOT EXISTS idx_shop_orders_shop_id ON shop_orders(shop_id);
CREATE INDEX IF NOT EXISTS idx_shop_orders_shopify_id ON shop_orders(shopify_id);
CREATE INDEX IF NOT EXISTS idx_shop_orders_order_number ON shop_orders(order_number);
CREATE INDEX IF NOT EXISTS idx_shop_orders_fulfillment_status ON shop_orders(fulfillment_status);
CREATE INDEX IF NOT EXISTS idx_shop_orders_is_archived ON shop_orders(is_archived);
CREATE INDEX IF NOT EXISTS idx_shop_order_items_order_id ON shop_order_items(order_id);
