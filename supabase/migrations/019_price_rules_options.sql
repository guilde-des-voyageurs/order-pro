-- Ajout du type de produit et des options (couleurs/tailles) aux règles de prix

-- Ajouter le champ product_type à la table price_rules
ALTER TABLE price_rules 
ADD COLUMN IF NOT EXISTS product_type VARCHAR(255);

COMMENT ON COLUMN price_rules.product_type IS 'Type de produit Shopify pour filtrer les variantes (ex: T-shirt, Sweat...)';

-- Table des majorations par option (couleur, taille, etc.)
CREATE TABLE IF NOT EXISTS price_rule_option_modifiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  price_rule_id UUID NOT NULL REFERENCES price_rules(id) ON DELETE CASCADE,
  
  -- Nom de l'option (ex: "Color", "Size", "Couleur", "Taille")
  option_name VARCHAR(255) NOT NULL,
  
  -- Valeur de l'option qui déclenche cette majoration (ex: "XXL", "French Navy")
  option_value VARCHAR(255) NOT NULL,
  
  -- Montant de la majoration (peut être négatif pour une réduction)
  modifier_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Une seule majoration par combinaison règle + option_name + option_value
  UNIQUE(price_rule_id, option_name, option_value)
);

CREATE INDEX IF NOT EXISTS idx_price_rule_option_modifiers_rule_id 
ON price_rule_option_modifiers(price_rule_id);
