-- Règles de prix dynamiques basées sur SKU + majorations métachamps

-- Table principale des règles de prix (une règle par SKU)
CREATE TABLE IF NOT EXISTS price_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  
  -- SKU ciblé par cette règle
  sku VARCHAR(255) NOT NULL,
  
  -- Prix de base pour ce SKU
  base_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  
  -- Description optionnelle
  description TEXT,
  
  -- Statut actif/inactif
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Dernière application de la règle
  last_applied_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(shop_id, sku)
);

-- Table des majorations par valeur de métachamp
CREATE TABLE IF NOT EXISTS price_rule_modifiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  price_rule_id UUID NOT NULL REFERENCES price_rules(id) ON DELETE CASCADE,
  
  -- Référence au métachamp configuré (namespace.key)
  metafield_namespace VARCHAR(255) NOT NULL,
  metafield_key VARCHAR(255) NOT NULL,
  
  -- Valeur du métachamp qui déclenche cette majoration
  metafield_value VARCHAR(255) NOT NULL,
  
  -- Montant de la majoration (peut être négatif pour une réduction)
  modifier_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Une seule majoration par combinaison règle + namespace + key + value
  UNIQUE(price_rule_id, metafield_namespace, metafield_key, metafield_value)
);

CREATE INDEX IF NOT EXISTS idx_price_rules_shop_id ON price_rules(shop_id);
CREATE INDEX IF NOT EXISTS idx_price_rules_sku ON price_rules(sku);
CREATE INDEX IF NOT EXISTS idx_price_rule_modifiers_rule_id ON price_rule_modifiers(price_rule_id);
