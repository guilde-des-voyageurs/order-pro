-- Ajout du coût de manutention dans les paramètres de commandes

ALTER TABLE order_settings 
ADD COLUMN IF NOT EXISTS handling_fee DECIMAL(10, 2) DEFAULT 0;

COMMENT ON COLUMN order_settings.handling_fee IS 'Coût de manutention ajouté à chaque commande (en euros HT)';
