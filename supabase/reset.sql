-- =============================================
-- Script de reset complet - À exécuter AVANT schema.sql
-- =============================================

-- Supprimer les tables (CASCADE supprime aussi les policies, triggers, index)
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS variants_ordered CASCADE;
DROP TABLE IF EXISTS textile_progress CASCADE;
DROP TABLE IF EXISTS line_item_checks CASCADE;
DROP TABLE IF EXISTS order_progress CASCADE;
DROP TABLE IF EXISTS price_rules CASCADE;
DROP TABLE IF EXISTS billing_notes CASCADE;
DROP TABLE IF EXISTS monthly_balance CASCADE;
DROP TABLE IF EXISTS syncs CASCADE;
DROP TABLE IF EXISTS order_invoices CASCADE;
DROP TABLE IF EXISTS order_costs CASCADE;
DROP TABLE IF EXISTS monthly_billing_notes CASCADE;
DROP TABLE IF EXISTS weekly_billing_notes CASCADE;
DROP TABLE IF EXISTS weekly_invoices CASCADE;

-- Supprimer la fonction si elle existe
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
