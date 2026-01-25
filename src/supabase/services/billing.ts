import { supabase } from '../client';
import type { OrderInvoice, OrderCost, MonthlyBalance, BillingNote, MonthlyBillingNote, WeeklyBillingNote, WeeklyInvoice } from '../types';

// ==================== Order Invoices ====================

/**
 * Récupère le statut de facturation d'une commande
 */
export async function getOrderInvoice(shopId: string, orderId: string) {
  const { data, error } = await supabase
    .from('order_invoices')
    .select('*')
    .eq('shop_id', shopId)
    .eq('order_id', orderId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data as OrderInvoice | null;
}

/**
 * Met à jour le statut de facturation d'une commande
 */
export async function setOrderInvoiced(shopId: string, orderId: string, invoiced: boolean) {
  const { data, error } = await supabase
    .from('order_invoices')
    .upsert({
      shop_id: shopId,
      order_id: orderId,
      invoiced,
    }, { onConflict: 'shop_id,order_id' })
    .select()
    .single();

  if (error) throw error;
  return data as OrderInvoice;
}

// ==================== Order Costs ====================

/**
 * Récupère les coûts d'une commande
 */
export async function getOrderCost(shopId: string, orderId: string) {
  const { data, error } = await supabase
    .from('order_costs')
    .select('*')
    .eq('shop_id', shopId)
    .eq('order_id', orderId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data as OrderCost | null;
}

/**
 * Sauvegarde les coûts d'une commande
 */
export async function saveOrderCost(
  shopId: string, 
  orderId: string, 
  costs: unknown[], 
  handlingFee: number = 4.5,
  balance: number = 0
) {
  const { data, error } = await supabase
    .from('order_costs')
    .upsert({
      shop_id: shopId,
      order_id: orderId,
      costs,
      handling_fee: handlingFee,
      balance,
    }, { onConflict: 'shop_id,order_id' })
    .select()
    .single();

  if (error) throw error;
  return data as OrderCost;
}

/**
 * Met à jour les frais de manutention d'une commande
 */
export async function updateHandlingFee(shopId: string, orderId: string, handlingFee: number) {
  const { data, error } = await supabase
    .from('order_costs')
    .update({ handling_fee: handlingFee })
    .eq('shop_id', shopId)
    .eq('order_id', orderId)
    .select()
    .single();

  if (error) throw error;
  return data as OrderCost;
}

/**
 * Met à jour la balance d'une commande
 */
export async function updateOrderBalance(shopId: string, orderId: string, balance: number) {
  const { data, error } = await supabase
    .from('order_costs')
    .update({ balance })
    .eq('shop_id', shopId)
    .eq('order_id', orderId)
    .select()
    .single();

  if (error) throw error;
  return data as OrderCost;
}

// ==================== Monthly Balance ====================

/**
 * Récupère la balance mensuelle
 */
export async function getMonthlyBalance(shopId: string, month: string) {
  const { data, error } = await supabase
    .from('monthly_balance')
    .select('*')
    .eq('shop_id', shopId)
    .eq('month', month)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data as MonthlyBalance | null;
}

/**
 * Met à jour la balance mensuelle
 */
export async function setMonthlyBalance(shopId: string, month: string, balance: number) {
  const { data, error } = await supabase
    .from('monthly_balance')
    .upsert({
      shop_id: shopId,
      month,
      balance,
    }, { onConflict: 'shop_id,month' })
    .select()
    .single();

  if (error) throw error;
  return data as MonthlyBalance;
}

// ==================== Billing Notes ====================

/**
 * Récupère la note de facturation d'une commande
 */
export async function getBillingNote(shopId: string, orderId: string) {
  const { data, error } = await supabase
    .from('billing_notes')
    .select('*')
    .eq('shop_id', shopId)
    .eq('order_id', orderId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data as BillingNote | null;
}

/**
 * Sauvegarde la note de facturation d'une commande
 */
export async function saveBillingNote(shopId: string, orderId: string, note: string) {
  const { data, error } = await supabase
    .from('billing_notes')
    .upsert({
      shop_id: shopId,
      order_id: orderId,
      note,
    }, { onConflict: 'shop_id,order_id' })
    .select()
    .single();

  if (error) throw error;
  return data as BillingNote;
}

// ==================== Monthly Billing Notes ====================

/**
 * Récupère la note de facturation mensuelle
 */
export async function getMonthlyBillingNote(shopId: string, month: string) {
  const { data, error } = await supabase
    .from('monthly_billing_notes')
    .select('*')
    .eq('shop_id', shopId)
    .eq('month', month)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data as MonthlyBillingNote | null;
}

/**
 * Sauvegarde la note de facturation mensuelle
 */
export async function saveMonthlyBillingNote(shopId: string, month: string, note: string) {
  const { data, error } = await supabase
    .from('monthly_billing_notes')
    .upsert({
      shop_id: shopId,
      month,
      note,
    }, { onConflict: 'shop_id,month' })
    .select()
    .single();

  if (error) throw error;
  return data as MonthlyBillingNote;
}

// ==================== Weekly Billing (for Batch) ====================

/**
 * Récupère la note de facturation hebdomadaire
 */
export async function getWeeklyBillingNote(shopId: string, week: string) {
  const { data, error } = await supabase
    .from('weekly_billing_notes')
    .select('*')
    .eq('shop_id', shopId)
    .eq('week', week)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data as WeeklyBillingNote | null;
}

/**
 * Sauvegarde la note de facturation hebdomadaire
 */
export async function saveWeeklyBillingNote(shopId: string, week: string, note: string) {
  const { data, error } = await supabase
    .from('weekly_billing_notes')
    .upsert({
      shop_id: shopId,
      week,
      note,
    }, { onConflict: 'shop_id,week' })
    .select()
    .single();

  if (error) throw error;
  return data as WeeklyBillingNote;
}

/**
 * Récupère le statut de facturation hebdomadaire
 */
export async function getWeeklyInvoice(shopId: string, week: string) {
  const { data, error } = await supabase
    .from('weekly_invoices')
    .select('*')
    .eq('shop_id', shopId)
    .eq('week', week)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data as WeeklyInvoice | null;
}

/**
 * Met à jour le statut de facturation hebdomadaire
 */
export async function setWeeklyInvoiced(shopId: string, week: string, invoiced: boolean) {
  const { data, error } = await supabase
    .from('weekly_invoices')
    .upsert({
      shop_id: shopId,
      week,
      invoiced,
    }, { onConflict: 'shop_id,week' })
    .select()
    .single();

  if (error) throw error;
  return data as WeeklyInvoice;
}
