-- Activer RLS sur la table orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Ajouter la colonne user_id si elle n'existe pas déjà
ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id);

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Utilisateurs peuvent voir leurs propres commandes" ON orders;
DROP POLICY IF EXISTS "Utilisateurs peuvent créer leurs propres commandes" ON orders;
DROP POLICY IF EXISTS "Utilisateurs peuvent mettre à jour leurs propres commandes" ON orders;

-- Créer les nouvelles politiques
CREATE POLICY "Utilisateurs peuvent voir leurs propres commandes"
ON orders FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Utilisateurs peuvent créer leurs propres commandes"
ON orders FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Utilisateurs peuvent mettre à jour leurs propres commandes"
ON orders FOR UPDATE
USING (auth.uid() = user_id);
