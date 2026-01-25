-- Module Fournisseurs - Tables pour les commandes de batch

-- Table des commandes fournisseur (batch)
CREATE TABLE IF NOT EXISTS supplier_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'completed')),
  note TEXT,
  subtotal DECIMAL(10, 2) DEFAULT 0,
  balance_adjustment DECIMAL(10, 2) DEFAULT 0,
  total_ht DECIMAL(10, 2) DEFAULT 0,
  total_ttc DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  UNIQUE(shop_id, order_number)
);

-- Table des lignes de commande fournisseur
CREATE TABLE IF NOT EXISTS supplier_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES supplier_orders(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  product_title TEXT NOT NULL,
  variant_title TEXT,
  sku TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10, 2) DEFAULT 0,
  line_total DECIMAL(10, 2) DEFAULT 0,
  is_validated BOOLEAN DEFAULT FALSE,
  validated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des règles de prix globales
CREATE TABLE IF NOT EXISTS pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  rule_name TEXT NOT NULL,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('base_price', 'color_markup', 'size_markup', 'sku_markup', 'custom')),
  condition_field TEXT, -- ex: 'color', 'size', 'sku_prefix'
  condition_value TEXT, -- ex: 'Rouge', 'XL', 'CRAFTER'
  price_value DECIMAL(10, 2) NOT NULL, -- prix ou majoration
  is_percentage BOOLEAN DEFAULT FALSE, -- si true, price_value est un pourcentage
  priority INTEGER DEFAULT 0, -- ordre d'application des règles
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des règles de couleurs (mapping nom -> hex)
CREATE TABLE IF NOT EXISTS color_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  color_name TEXT NOT NULL,
  hex_value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(shop_id, color_name)
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_supplier_orders_shop_id ON supplier_orders(shop_id);
CREATE INDEX IF NOT EXISTS idx_supplier_orders_status ON supplier_orders(status);
CREATE INDEX IF NOT EXISTS idx_supplier_order_items_order_id ON supplier_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_shop_id ON pricing_rules(shop_id);
CREATE INDEX IF NOT EXISTS idx_color_rules_shop_id ON color_rules(shop_id);

-- RLS Policies
ALTER TABLE supplier_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE color_rules ENABLE ROW LEVEL SECURITY;

-- Policies pour supplier_orders
CREATE POLICY "Users can view their shop supplier orders"
  ON supplier_orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_shops 
      WHERE user_shops.shop_id = supplier_orders.shop_id 
      AND user_shops.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert supplier orders for their shops"
  ON supplier_orders FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_shops 
      WHERE user_shops.shop_id = supplier_orders.shop_id 
      AND user_shops.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their shop supplier orders"
  ON supplier_orders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_shops 
      WHERE user_shops.shop_id = supplier_orders.shop_id 
      AND user_shops.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their shop supplier orders"
  ON supplier_orders FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_shops 
      WHERE user_shops.shop_id = supplier_orders.shop_id 
      AND user_shops.user_id = auth.uid()
    )
  );

-- Policies pour supplier_order_items
CREATE POLICY "Users can view supplier order items"
  ON supplier_order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM supplier_orders so
      JOIN user_shops us ON us.shop_id = so.shop_id
      WHERE so.id = supplier_order_items.order_id
      AND us.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert supplier order items"
  ON supplier_order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM supplier_orders so
      JOIN user_shops us ON us.shop_id = so.shop_id
      WHERE so.id = supplier_order_items.order_id
      AND us.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update supplier order items"
  ON supplier_order_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM supplier_orders so
      JOIN user_shops us ON us.shop_id = so.shop_id
      WHERE so.id = supplier_order_items.order_id
      AND us.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete supplier order items"
  ON supplier_order_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM supplier_orders so
      JOIN user_shops us ON us.shop_id = so.shop_id
      WHERE so.id = supplier_order_items.order_id
      AND us.user_id = auth.uid()
    )
  );

-- Policies pour pricing_rules
CREATE POLICY "Users can view their shop pricing rules"
  ON pricing_rules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_shops 
      WHERE user_shops.shop_id = pricing_rules.shop_id 
      AND user_shops.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their shop pricing rules"
  ON pricing_rules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_shops 
      WHERE user_shops.shop_id = pricing_rules.shop_id 
      AND user_shops.user_id = auth.uid()
    )
  );

-- Policies pour color_rules
CREATE POLICY "Users can view their shop color rules"
  ON color_rules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_shops 
      WHERE user_shops.shop_id = color_rules.shop_id 
      AND user_shops.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their shop color rules"
  ON color_rules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_shops 
      WHERE user_shops.shop_id = color_rules.shop_id 
      AND user_shops.user_id = auth.uid()
    )
  );
