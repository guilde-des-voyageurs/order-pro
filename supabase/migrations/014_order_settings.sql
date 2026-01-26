-- Paramètres des commandes par boutique
-- Notes pour l'imprimeur et emplacements à synchroniser

CREATE TABLE IF NOT EXISTS order_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  
  -- Notes pour l'imprimeur (affichées en haut de la page commandes)
  printer_notes TEXT[] DEFAULT '{}',
  
  -- Emplacements à synchroniser (si vide = tous les emplacements)
  sync_location_ids TEXT[] DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(shop_id)
);

CREATE INDEX IF NOT EXISTS idx_order_settings_shop_id ON order_settings(shop_id);
