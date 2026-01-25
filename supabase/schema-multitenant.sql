-- =============================================
-- IVY - Schéma de base de données Supabase
-- Version Multi-Tenant (Multi-Boutiques)
-- =============================================

-- =============================================
-- Tables de gestion des boutiques et utilisateurs
-- =============================================

-- Table des boutiques Shopify
CREATE TABLE IF NOT EXISTS shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  shopify_url TEXT NOT NULL,
  shopify_token TEXT NOT NULL,
  shopify_location_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table de liaison utilisateurs <-> boutiques (many-to-many)
CREATE TABLE IF NOT EXISTS user_shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member', -- 'owner', 'admin', 'member'
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, shop_id)
);

CREATE INDEX IF NOT EXISTS idx_user_shops_user_id ON user_shops(user_id);
CREATE INDEX IF NOT EXISTS idx_user_shops_shop_id ON user_shops(shop_id);

-- =============================================
-- Tables métier (toutes avec shop_id)
-- =============================================

-- Table des commandes
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  shopify_id TEXT NOT NULL,
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
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(shop_id, shopify_id)
);

CREATE INDEX IF NOT EXISTS idx_orders_shop_id ON orders(shop_id);
CREATE INDEX IF NOT EXISTS idx_orders_fulfillment_status ON orders(display_fulfillment_status);
CREATE INDEX IF NOT EXISTS idx_orders_financial_status ON orders(display_financial_status);
CREATE INDEX IF NOT EXISTS idx_orders_tags ON orders USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- Table des checkboxes sur les articles
CREATE TABLE IF NOT EXISTS line_item_checks (
  id TEXT PRIMARY KEY,
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  order_id TEXT NOT NULL,
  sku TEXT NOT NULL,
  color TEXT NOT NULL,
  size TEXT NOT NULL,
  product_index INTEGER NOT NULL,
  quantity_index INTEGER NOT NULL,
  checked BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_line_item_checks_shop_id ON line_item_checks(shop_id);
CREATE INDEX IF NOT EXISTS idx_line_item_checks_order_id ON line_item_checks(order_id);
CREATE INDEX IF NOT EXISTS idx_line_item_checks_checked ON line_item_checks(checked);
CREATE INDEX IF NOT EXISTS idx_line_item_checks_sku_color_size ON line_item_checks(sku, color, size);

-- Table de progression par commande
CREATE TABLE IF NOT EXISTS order_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  order_id TEXT NOT NULL,
  total_count INTEGER NOT NULL DEFAULT 0,
  checked_count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(shop_id, order_id)
);

CREATE INDEX IF NOT EXISTS idx_order_progress_shop_id ON order_progress(shop_id);

-- Table des règles de prix
CREATE TABLE IF NOT EXISTS price_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  search_string TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_price_rules_shop_id ON price_rules(shop_id);
CREATE INDEX IF NOT EXISTS idx_price_rules_search ON price_rules(search_string);

-- Table des notes de facturation par commande
CREATE TABLE IF NOT EXISTS billing_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  order_id TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(shop_id, order_id)
);

CREATE INDEX IF NOT EXISTS idx_billing_notes_shop_id ON billing_notes(shop_id);

-- Table des balances mensuelles
CREATE TABLE IF NOT EXISTS monthly_balance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  month TEXT NOT NULL, -- Format: YYYY-MM
  balance DECIMAL(10, 2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(shop_id, month)
);

CREATE INDEX IF NOT EXISTS idx_monthly_balance_shop_id ON monthly_balance(shop_id);

-- Table des synchronisations
CREATE TABLE IF NOT EXISTS syncs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'running', -- running, completed, failed
  completed_at TIMESTAMPTZ,
  orders_count INTEGER
);

CREATE INDEX IF NOT EXISTS idx_syncs_shop_id ON syncs(shop_id);

-- Table des factures par commande
CREATE TABLE IF NOT EXISTS order_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  order_id TEXT NOT NULL,
  invoiced BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(shop_id, order_id)
);

CREATE INDEX IF NOT EXISTS idx_order_invoices_shop_id ON order_invoices(shop_id);

-- Table des coûts par commande
CREATE TABLE IF NOT EXISTS order_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  order_id TEXT NOT NULL,
  costs JSONB NOT NULL DEFAULT '[]',
  handling_fee DECIMAL(10, 2) NOT NULL DEFAULT 4.5,
  balance DECIMAL(10, 2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(shop_id, order_id)
);

CREATE INDEX IF NOT EXISTS idx_order_costs_shop_id ON order_costs(shop_id);

-- Table des notes de facturation mensuelles
CREATE TABLE IF NOT EXISTS monthly_billing_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  month TEXT NOT NULL, -- Format: YYYY-MM
  note TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(shop_id, month)
);

CREATE INDEX IF NOT EXISTS idx_monthly_billing_notes_shop_id ON monthly_billing_notes(shop_id);

-- Table des notes de facturation hebdomadaires (pour batch)
CREATE TABLE IF NOT EXISTS weekly_billing_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  week TEXT NOT NULL, -- Format: YYYY-WXX
  note TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(shop_id, week)
);

CREATE INDEX IF NOT EXISTS idx_weekly_billing_notes_shop_id ON weekly_billing_notes(shop_id);

-- Table des factures hebdomadaires (pour batch)
CREATE TABLE IF NOT EXISTS weekly_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  week TEXT NOT NULL, -- Format: YYYY-WXX
  invoiced BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(shop_id, week)
);

CREATE INDEX IF NOT EXISTS idx_weekly_invoices_shop_id ON weekly_invoices(shop_id);

-- =============================================
-- Row Level Security (RLS)
-- =============================================

-- Activer RLS sur toutes les tables
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_shops ENABLE ROW LEVEL SECURITY;
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

-- Fonction helper pour vérifier l'accès à une boutique
CREATE OR REPLACE FUNCTION user_has_shop_access(check_shop_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_shops 
    WHERE user_id = auth.uid() 
    AND shop_id = check_shop_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Politiques pour shops
CREATE POLICY "Users can view their shops" ON shops 
  FOR SELECT USING (user_has_shop_access(id));
CREATE POLICY "Users can create shops" ON shops 
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their shops" ON shops 
  FOR UPDATE USING (user_has_shop_access(id));
CREATE POLICY "Owners can delete their shops" ON shops 
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM user_shops 
      WHERE user_id = auth.uid() 
      AND shop_id = id 
      AND role = 'owner'
    )
  );

-- Politiques pour user_shops
CREATE POLICY "Users can view their shop memberships" ON user_shops 
  FOR SELECT USING (user_id = auth.uid() OR user_has_shop_access(shop_id));
CREATE POLICY "Users can create shop memberships" ON user_shops 
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their memberships" ON user_shops 
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete their memberships" ON user_shops 
  FOR DELETE USING (user_id = auth.uid());

-- Macro pour créer les politiques sur les tables métier
-- (Toutes les tables avec shop_id suivent le même pattern)

-- orders
CREATE POLICY "Users can view orders of their shops" ON orders 
  FOR SELECT USING (user_has_shop_access(shop_id));
CREATE POLICY "Users can insert orders in their shops" ON orders 
  FOR INSERT WITH CHECK (user_has_shop_access(shop_id));
CREATE POLICY "Users can update orders in their shops" ON orders 
  FOR UPDATE USING (user_has_shop_access(shop_id));
CREATE POLICY "Users can delete orders in their shops" ON orders 
  FOR DELETE USING (user_has_shop_access(shop_id));

-- line_item_checks
CREATE POLICY "Users can view line_item_checks of their shops" ON line_item_checks 
  FOR SELECT USING (user_has_shop_access(shop_id));
CREATE POLICY "Users can insert line_item_checks in their shops" ON line_item_checks 
  FOR INSERT WITH CHECK (user_has_shop_access(shop_id));
CREATE POLICY "Users can update line_item_checks in their shops" ON line_item_checks 
  FOR UPDATE USING (user_has_shop_access(shop_id));
CREATE POLICY "Users can delete line_item_checks in their shops" ON line_item_checks 
  FOR DELETE USING (user_has_shop_access(shop_id));

-- order_progress
CREATE POLICY "Users can view order_progress of their shops" ON order_progress 
  FOR SELECT USING (user_has_shop_access(shop_id));
CREATE POLICY "Users can insert order_progress in their shops" ON order_progress 
  FOR INSERT WITH CHECK (user_has_shop_access(shop_id));
CREATE POLICY "Users can update order_progress in their shops" ON order_progress 
  FOR UPDATE USING (user_has_shop_access(shop_id));
CREATE POLICY "Users can delete order_progress in their shops" ON order_progress 
  FOR DELETE USING (user_has_shop_access(shop_id));

-- price_rules
CREATE POLICY "Users can view price_rules of their shops" ON price_rules 
  FOR SELECT USING (user_has_shop_access(shop_id));
CREATE POLICY "Users can insert price_rules in their shops" ON price_rules 
  FOR INSERT WITH CHECK (user_has_shop_access(shop_id));
CREATE POLICY "Users can update price_rules in their shops" ON price_rules 
  FOR UPDATE USING (user_has_shop_access(shop_id));
CREATE POLICY "Users can delete price_rules in their shops" ON price_rules 
  FOR DELETE USING (user_has_shop_access(shop_id));

-- billing_notes
CREATE POLICY "Users can view billing_notes of their shops" ON billing_notes 
  FOR SELECT USING (user_has_shop_access(shop_id));
CREATE POLICY "Users can insert billing_notes in their shops" ON billing_notes 
  FOR INSERT WITH CHECK (user_has_shop_access(shop_id));
CREATE POLICY "Users can update billing_notes in their shops" ON billing_notes 
  FOR UPDATE USING (user_has_shop_access(shop_id));
CREATE POLICY "Users can delete billing_notes in their shops" ON billing_notes 
  FOR DELETE USING (user_has_shop_access(shop_id));

-- monthly_balance
CREATE POLICY "Users can view monthly_balance of their shops" ON monthly_balance 
  FOR SELECT USING (user_has_shop_access(shop_id));
CREATE POLICY "Users can insert monthly_balance in their shops" ON monthly_balance 
  FOR INSERT WITH CHECK (user_has_shop_access(shop_id));
CREATE POLICY "Users can update monthly_balance in their shops" ON monthly_balance 
  FOR UPDATE USING (user_has_shop_access(shop_id));
CREATE POLICY "Users can delete monthly_balance in their shops" ON monthly_balance 
  FOR DELETE USING (user_has_shop_access(shop_id));

-- syncs
CREATE POLICY "Users can view syncs of their shops" ON syncs 
  FOR SELECT USING (user_has_shop_access(shop_id));
CREATE POLICY "Users can insert syncs in their shops" ON syncs 
  FOR INSERT WITH CHECK (user_has_shop_access(shop_id));
CREATE POLICY "Users can update syncs in their shops" ON syncs 
  FOR UPDATE USING (user_has_shop_access(shop_id));
CREATE POLICY "Users can delete syncs in their shops" ON syncs 
  FOR DELETE USING (user_has_shop_access(shop_id));

-- order_invoices
CREATE POLICY "Users can view order_invoices of their shops" ON order_invoices 
  FOR SELECT USING (user_has_shop_access(shop_id));
CREATE POLICY "Users can insert order_invoices in their shops" ON order_invoices 
  FOR INSERT WITH CHECK (user_has_shop_access(shop_id));
CREATE POLICY "Users can update order_invoices in their shops" ON order_invoices 
  FOR UPDATE USING (user_has_shop_access(shop_id));
CREATE POLICY "Users can delete order_invoices in their shops" ON order_invoices 
  FOR DELETE USING (user_has_shop_access(shop_id));

-- order_costs
CREATE POLICY "Users can view order_costs of their shops" ON order_costs 
  FOR SELECT USING (user_has_shop_access(shop_id));
CREATE POLICY "Users can insert order_costs in their shops" ON order_costs 
  FOR INSERT WITH CHECK (user_has_shop_access(shop_id));
CREATE POLICY "Users can update order_costs in their shops" ON order_costs 
  FOR UPDATE USING (user_has_shop_access(shop_id));
CREATE POLICY "Users can delete order_costs in their shops" ON order_costs 
  FOR DELETE USING (user_has_shop_access(shop_id));

-- monthly_billing_notes
CREATE POLICY "Users can view monthly_billing_notes of their shops" ON monthly_billing_notes 
  FOR SELECT USING (user_has_shop_access(shop_id));
CREATE POLICY "Users can insert monthly_billing_notes in their shops" ON monthly_billing_notes 
  FOR INSERT WITH CHECK (user_has_shop_access(shop_id));
CREATE POLICY "Users can update monthly_billing_notes in their shops" ON monthly_billing_notes 
  FOR UPDATE USING (user_has_shop_access(shop_id));
CREATE POLICY "Users can delete monthly_billing_notes in their shops" ON monthly_billing_notes 
  FOR DELETE USING (user_has_shop_access(shop_id));

-- weekly_billing_notes
CREATE POLICY "Users can view weekly_billing_notes of their shops" ON weekly_billing_notes 
  FOR SELECT USING (user_has_shop_access(shop_id));
CREATE POLICY "Users can insert weekly_billing_notes in their shops" ON weekly_billing_notes 
  FOR INSERT WITH CHECK (user_has_shop_access(shop_id));
CREATE POLICY "Users can update weekly_billing_notes in their shops" ON weekly_billing_notes 
  FOR UPDATE USING (user_has_shop_access(shop_id));
CREATE POLICY "Users can delete weekly_billing_notes in their shops" ON weekly_billing_notes 
  FOR DELETE USING (user_has_shop_access(shop_id));

-- weekly_invoices
CREATE POLICY "Users can view weekly_invoices of their shops" ON weekly_invoices 
  FOR SELECT USING (user_has_shop_access(shop_id));
CREATE POLICY "Users can insert weekly_invoices in their shops" ON weekly_invoices 
  FOR INSERT WITH CHECK (user_has_shop_access(shop_id));
CREATE POLICY "Users can update weekly_invoices in their shops" ON weekly_invoices 
  FOR UPDATE USING (user_has_shop_access(shop_id));
CREATE POLICY "Users can delete weekly_invoices in their shops" ON weekly_invoices 
  FOR DELETE USING (user_has_shop_access(shop_id));

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
CREATE TRIGGER update_shops_updated_at BEFORE UPDATE ON shops FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
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
ALTER PUBLICATION supabase_realtime ADD TABLE user_shops;
