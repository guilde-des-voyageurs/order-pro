-- Statuts de facturation mensuelle par boutique

CREATE TABLE IF NOT EXISTS monthly_billing_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  month_key VARCHAR(7) NOT NULL, -- Format: YYYY-MM
  
  is_invoiced BOOLEAN DEFAULT FALSE,
  is_paid BOOLEAN DEFAULT FALSE,
  
  invoiced_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(shop_id, month_key)
);

CREATE INDEX IF NOT EXISTS idx_monthly_billing_status_shop_month 
ON monthly_billing_status(shop_id, month_key);
