-- =============================================
-- IVY - Schéma de base de données Supabase
-- Migration depuis Firebase Firestore
-- =============================================

-- Table des commandes (orders-v2)
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shopify_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  order_number TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  cancelled_at TIMESTAMPTZ,
  display_fulfillment_status TEXT NOT NULL,
  display_financial_status TEXT NOT NULL,
  total_price TEXT NOT NULL,
  total_price_currency TEXT NOT NULL DEFAULT 'EUR',
  note TEXT,
  tags TEXT[] DEFAULT '{}',
  line_items JSONB NOT NULL DEFAULT '[]',
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_orders_fulfillment_status ON orders(display_fulfillment_status);
CREATE INDEX IF NOT EXISTS idx_orders_financial_status ON orders(display_financial_status);
CREATE INDEX IF NOT EXISTS idx_orders_tags ON orders USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- Table des checkboxes sur les articles (anciennement variants-ordered-v2)
CREATE TABLE IF NOT EXISTS line_item_checks (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  sku TEXT NOT NULL,
  color TEXT NOT NULL,
  size TEXT NOT NULL,
  product_index INTEGER NOT NULL,
  quantity_index INTEGER NOT NULL,
  checked BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_line_item_checks_order_id ON line_item_checks(order_id);
CREATE INDEX IF NOT EXISTS idx_line_item_checks_checked ON line_item_checks(checked);
CREATE INDEX IF NOT EXISTS idx_line_item_checks_sku_color_size ON line_item_checks(sku, color, size);

-- Table de progression par commande (anciennement textile-progress-v2)
CREATE TABLE IF NOT EXISTS order_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT UNIQUE NOT NULL,
  total_count INTEGER NOT NULL DEFAULT 0,
  checked_count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table des règles de prix (price-rules)
CREATE TABLE IF NOT EXISTS price_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  search_string TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_price_rules_search ON price_rules(search_string);

-- Table des notes de facturation par commande (billing-notes)
CREATE TABLE IF NOT EXISTS billing_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT UNIQUE NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table des balances mensuelles (monthly-balance)
CREATE TABLE IF NOT EXISTS monthly_balance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month TEXT UNIQUE NOT NULL, -- Format: YYYY-MM
  balance DECIMAL(10, 2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table des synchronisations (syncs)
CREATE TABLE IF NOT EXISTS syncs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'running', -- running, completed, failed
  completed_at TIMESTAMPTZ,
  orders_count INTEGER
);

-- Table des factures par commande (order-invoices)
CREATE TABLE IF NOT EXISTS order_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT UNIQUE NOT NULL,
  invoiced BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table des coûts par commande (order-costs)
CREATE TABLE IF NOT EXISTS order_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT UNIQUE NOT NULL,
  costs JSONB NOT NULL DEFAULT '[]',
  handling_fee DECIMAL(10, 2) NOT NULL DEFAULT 4.5,
  balance DECIMAL(10, 2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table des notes de facturation mensuelles
CREATE TABLE IF NOT EXISTS monthly_billing_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month TEXT UNIQUE NOT NULL, -- Format: YYYY-MM
  note TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table des notes de facturation hebdomadaires (pour batch)
CREATE TABLE IF NOT EXISTS weekly_billing_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week TEXT UNIQUE NOT NULL, -- Format: YYYY-WXX
  note TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table des factures hebdomadaires (pour batch)
CREATE TABLE IF NOT EXISTS weekly_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week TEXT UNIQUE NOT NULL, -- Format: YYYY-WXX
  invoiced BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- Row Level Security (RLS)
-- =============================================

-- Activer RLS sur toutes les tables
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE line_item_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_balance ENABLE ROW LEVEL SECURITY;
ALTER TABLE syncs ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_billing_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_billing_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_invoices ENABLE ROW LEVEL SECURITY;

-- Politiques: utilisateurs authentifiés ont accès complet
CREATE POLICY "Authenticated users can read orders" ON orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert orders" ON orders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update orders" ON orders FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete orders" ON orders FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can read line_item_checks" ON line_item_checks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert line_item_checks" ON line_item_checks FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update line_item_checks" ON line_item_checks FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete line_item_checks" ON line_item_checks FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can read order_progress" ON order_progress FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert order_progress" ON order_progress FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update order_progress" ON order_progress FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete order_progress" ON order_progress FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can read price_rules" ON price_rules FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert price_rules" ON price_rules FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update price_rules" ON price_rules FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete price_rules" ON price_rules FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can read billing_notes" ON billing_notes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert billing_notes" ON billing_notes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update billing_notes" ON billing_notes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete billing_notes" ON billing_notes FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can read monthly_balance" ON monthly_balance FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert monthly_balance" ON monthly_balance FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update monthly_balance" ON monthly_balance FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete monthly_balance" ON monthly_balance FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can read syncs" ON syncs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert syncs" ON syncs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update syncs" ON syncs FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete syncs" ON syncs FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can read order_invoices" ON order_invoices FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert order_invoices" ON order_invoices FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update order_invoices" ON order_invoices FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete order_invoices" ON order_invoices FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can read order_costs" ON order_costs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert order_costs" ON order_costs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update order_costs" ON order_costs FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete order_costs" ON order_costs FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can read monthly_billing_notes" ON monthly_billing_notes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert monthly_billing_notes" ON monthly_billing_notes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update monthly_billing_notes" ON monthly_billing_notes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete monthly_billing_notes" ON monthly_billing_notes FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can read weekly_billing_notes" ON weekly_billing_notes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert weekly_billing_notes" ON weekly_billing_notes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update weekly_billing_notes" ON weekly_billing_notes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete weekly_billing_notes" ON weekly_billing_notes FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can read weekly_invoices" ON weekly_invoices FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert weekly_invoices" ON weekly_invoices FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update weekly_invoices" ON weekly_invoices FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete weekly_invoices" ON weekly_invoices FOR DELETE TO authenticated USING (true);

-- Politique pour service_role (API routes serveur)
-- Le service_role bypass automatiquement RLS, pas besoin de politiques spécifiques

-- =============================================
-- Fonctions utilitaires
-- =============================================

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
CREATE TRIGGER update_line_item_checks_updated_at BEFORE UPDATE ON line_item_checks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_order_progress_updated_at BEFORE UPDATE ON order_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_billing_notes_updated_at BEFORE UPDATE ON billing_notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_monthly_balance_updated_at BEFORE UPDATE ON monthly_balance FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_order_invoices_updated_at BEFORE UPDATE ON order_invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_order_costs_updated_at BEFORE UPDATE ON order_costs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_monthly_billing_notes_updated_at BEFORE UPDATE ON monthly_billing_notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_weekly_billing_notes_updated_at BEFORE UPDATE ON weekly_billing_notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_weekly_invoices_updated_at BEFORE UPDATE ON weekly_invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- Realtime
-- =============================================

-- Activer Realtime sur les tables qui en ont besoin
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE line_item_checks;
ALTER PUBLICATION supabase_realtime ADD TABLE order_progress;
ALTER PUBLICATION supabase_realtime ADD TABLE price_rules;
ALTER PUBLICATION supabase_realtime ADD TABLE syncs;
