-- Ajouter la colonne cost pour stocker le coût d'achat Shopify des variantes
-- Ce coût remplace le système de règles de prix

ALTER TABLE product_variants 
ADD COLUMN IF NOT EXISTS cost DECIMAL(10, 2) DEFAULT 0;

-- Supprimer les tables de règles de prix qui ne sont plus utilisées
DROP TABLE IF EXISTS pricing_rules CASCADE;
DROP TABLE IF EXISTS metafield_display_rules CASCADE;
DROP TABLE IF EXISTS variant_metafields CASCADE;

-- Supprimer la colonne pricing_string qui n'est plus nécessaire
ALTER TABLE supplier_order_items 
DROP COLUMN IF EXISTS pricing_string;
