-- Modifier les statuts des commandes fournisseur
-- Nouveaux statuts : draft (brouillon), requested (demandé), produced (produite), completed (terminée)

-- Supprimer l'ancienne contrainte
ALTER TABLE supplier_orders DROP CONSTRAINT IF EXISTS supplier_orders_status_check;

-- Mettre à jour les anciennes valeurs
UPDATE supplier_orders SET status = 'requested' WHERE status = 'in_progress';

-- Ajouter la nouvelle contrainte
ALTER TABLE supplier_orders 
ADD CONSTRAINT supplier_orders_status_check 
CHECK (status IN ('draft', 'requested', 'produced', 'completed'));
