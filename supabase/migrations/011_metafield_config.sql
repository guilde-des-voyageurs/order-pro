-- Configuration des métachamps à récupérer pour les commandes batch
-- Ces métachamps seront récupérés via GraphQL lors de l'ajout d'articles

CREATE TABLE IF NOT EXISTS metafield_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  namespace TEXT NOT NULL,
  key TEXT NOT NULL,
  display_name TEXT, -- Nom à afficher dans l'UI
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(shop_id, namespace, key)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_metafield_config_shop_id ON metafield_config(shop_id);

-- RLS
ALTER TABLE metafield_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view metafield config of their shops" ON metafield_config
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_shops 
      WHERE user_shops.shop_id = metafield_config.shop_id 
      AND user_shops.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert metafield config to their shops" ON metafield_config
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_shops 
      WHERE user_shops.shop_id = metafield_config.shop_id 
      AND user_shops.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update metafield config of their shops" ON metafield_config
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_shops 
      WHERE user_shops.shop_id = metafield_config.shop_id 
      AND user_shops.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete metafield config of their shops" ON metafield_config
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM user_shops 
      WHERE user_shops.shop_id = metafield_config.shop_id 
      AND user_shops.user_id = auth.uid()
    )
  );

-- Ajouter une colonne JSONB pour stocker les métachamps des articles de commande
ALTER TABLE supplier_order_items 
ADD COLUMN IF NOT EXISTS metafields JSONB DEFAULT '{}';
