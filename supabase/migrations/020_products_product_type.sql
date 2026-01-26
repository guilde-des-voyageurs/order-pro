-- Ajouter le champ product_type à la table products pour filtrer par type de produit

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS product_type VARCHAR(255);

COMMENT ON COLUMN products.product_type IS 'Type de produit Shopify (ex: T-shirt unisexe léger, Sweat à capuche...)';

-- Index pour les performances de filtrage
CREATE INDEX IF NOT EXISTS idx_products_product_type ON products(product_type);
