-- Ajouter la colonne pricing_string pour stocker la chaîne de facturation
-- Cette chaîne contient : Nom produit, SKU, Options, Métachamps
-- Elle est utilisée pour calculer le prix d'achat en scannant les règles de prix

ALTER TABLE supplier_order_items 
ADD COLUMN IF NOT EXISTS pricing_string TEXT;

-- Index pour recherche éventuelle
CREATE INDEX IF NOT EXISTS idx_supplier_order_items_pricing_string 
ON supplier_order_items(pricing_string);
