-- Ajouter les noms des options aux produits
ALTER TABLE products ADD COLUMN IF NOT EXISTS option1_name TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS option2_name TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS option3_name TEXT;
