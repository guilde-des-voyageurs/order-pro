-- Ajout de la colonne user_id à la table sync_logs
ALTER TABLE sync_logs ADD COLUMN user_id UUID NOT NULL REFERENCES auth.users(id);

-- Mise à jour des politiques RLS pour inclure user_id
DROP POLICY IF EXISTS "Utilisateurs peuvent voir leurs propres logs" ON sync_logs;
DROP POLICY IF EXISTS "Utilisateurs peuvent créer leurs propres logs" ON sync_logs;
DROP POLICY IF EXISTS "Utilisateurs peuvent mettre à jour leurs propres logs" ON sync_logs;

CREATE POLICY "Utilisateurs peuvent voir leurs propres logs"
ON sync_logs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Utilisateurs peuvent créer leurs propres logs"
ON sync_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Utilisateurs peuvent mettre à jour leurs propres logs"
ON sync_logs FOR UPDATE
USING (auth.uid() = user_id);
