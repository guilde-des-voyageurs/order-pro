-- Table pour stocker les metafields des variantes de produits
-- Les metafields sont des champs personnalisés Shopify (ex: couleur saisonnière, impression recto/verso, etc.)

CREATE TABLE IF NOT EXISTS variant_metafields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  namespace TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT,
  type TEXT, -- string, number, boolean, json, etc.
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(variant_id, namespace, key)
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_variant_metafields_variant_id ON variant_metafields(variant_id);
CREATE INDEX IF NOT EXISTS idx_variant_metafields_namespace_key ON variant_metafields(namespace, key);

-- RLS Policies
ALTER TABLE variant_metafields ENABLE ROW LEVEL SECURITY;

-- Policy pour variant_metafields (via product_variants -> products)
CREATE POLICY "Users can view metafields of their variants" ON variant_metafields
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM product_variants
      JOIN products ON products.id = product_variants.product_id
      JOIN user_shops ON user_shops.shop_id = products.shop_id
      WHERE product_variants.id = variant_metafields.variant_id 
      AND user_shops.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert metafields to their variants" ON variant_metafields
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM product_variants
      JOIN products ON products.id = product_variants.product_id
      JOIN user_shops ON user_shops.shop_id = products.shop_id
      WHERE product_variants.id = variant_metafields.variant_id 
      AND user_shops.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update metafields of their variants" ON variant_metafields
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM product_variants
      JOIN products ON products.id = product_variants.product_id
      JOIN user_shops ON user_shops.shop_id = products.shop_id
      WHERE product_variants.id = variant_metafields.variant_id 
      AND user_shops.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete metafields of their variants" ON variant_metafields
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM product_variants
      JOIN products ON products.id = product_variants.product_id
      JOIN user_shops ON user_shops.shop_id = products.shop_id
      WHERE product_variants.id = variant_metafields.variant_id 
      AND user_shops.user_id = auth.uid()
    )
  );

-- Table pour configurer quels metafields afficher dans les commandes batch
CREATE TABLE IF NOT EXISTS metafield_display_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  metafield_key TEXT NOT NULL, -- ex: "verso_impression", "couleur_saisonniere"
  display_name TEXT, -- Nom à afficher dans l'UI (optionnel, sinon utilise la clé)
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(shop_id, metafield_key)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_metafield_display_rules_shop_id ON metafield_display_rules(shop_id);

-- RLS
ALTER TABLE metafield_display_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view metafield rules of their shops" ON metafield_display_rules
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_shops 
      WHERE user_shops.shop_id = metafield_display_rules.shop_id 
      AND user_shops.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert metafield rules to their shops" ON metafield_display_rules
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_shops 
      WHERE user_shops.shop_id = metafield_display_rules.shop_id 
      AND user_shops.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update metafield rules of their shops" ON metafield_display_rules
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_shops 
      WHERE user_shops.shop_id = metafield_display_rules.shop_id 
      AND user_shops.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete metafield rules of their shops" ON metafield_display_rules
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM user_shops 
      WHERE user_shops.shop_id = metafield_display_rules.shop_id 
      AND user_shops.user_id = auth.uid()
    )
  );