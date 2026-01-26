-- Refactorisation de la table color_rules
-- Nouveau schéma : reception_name (nom reçu de Shopify), display_name (nom affiché sur Ivy), hex_value (couleur)

-- Ajouter la nouvelle colonne display_name si elle n'existe pas
ALTER TABLE color_rules ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Ajouter la colonne reception_name si elle n'existe pas
ALTER TABLE color_rules ADD COLUMN IF NOT EXISTS reception_name TEXT;

-- Migrer les données de color_name vers reception_name (si color_name existe)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'color_rules' AND column_name = 'color_name') THEN
    UPDATE color_rules SET reception_name = color_name WHERE reception_name IS NULL;
    -- Migrer hex_value vers display_name (car hex_value contenait le nom anglais)
    UPDATE color_rules SET display_name = hex_value WHERE display_name IS NULL AND hex_value IS NOT NULL AND hex_value !~ '^#[0-9A-Fa-f]{6}$';
    -- Supprimer l'ancienne colonne
    ALTER TABLE color_rules DROP COLUMN color_name;
  END IF;
END $$;

-- Mettre une valeur par défaut pour hex_value (gris par défaut)
UPDATE color_rules SET hex_value = '#808080' WHERE hex_value IS NULL OR hex_value !~ '^#[0-9A-Fa-f]{6}$';

-- Mettre à jour les contraintes
ALTER TABLE color_rules DROP CONSTRAINT IF EXISTS color_rules_shop_id_color_name_key;
ALTER TABLE color_rules DROP CONSTRAINT IF EXISTS color_rules_shop_id_reception_name_key;
ALTER TABLE color_rules ADD CONSTRAINT color_rules_shop_id_reception_name_key UNIQUE(shop_id, reception_name);
