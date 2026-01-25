import { supabase } from '../client';
import type { LineItemCheck, LineItemCheckInsert } from '../types';

/**
 * Récupère l'état d'une checkbox
 */
export async function getLineItemCheck(checkId: string) {
  const { data, error } = await supabase
    .from('line_item_checks')
    .select('*')
    .eq('id', checkId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data as LineItemCheck | null;
}

/**
 * Récupère toutes les checkboxes d'une commande
 */
export async function getLineItemChecksByOrder(shopId: string, orderId: string) {
  const { data, error } = await supabase
    .from('line_item_checks')
    .select('*')
    .eq('shop_id', shopId)
    .eq('order_id', orderId);

  if (error) throw error;
  return data as LineItemCheck[];
}

/**
 * Récupère toutes les checkboxes cochées d'une boutique
 */
export async function getCheckedLineItems(shopId: string) {
  const { data, error } = await supabase
    .from('line_item_checks')
    .select('*')
    .eq('shop_id', shopId)
    .eq('checked', true);

  if (error) throw error;
  return data as LineItemCheck[];
}

/**
 * Récupère toutes les checkboxes non cochées d'une boutique
 */
export async function getUncheckedLineItems(shopId: string) {
  const { data, error } = await supabase
    .from('line_item_checks')
    .select('*')
    .eq('shop_id', shopId)
    .eq('checked', false);

  if (error) throw error;
  return data as LineItemCheck[];
}

/**
 * Crée ou met à jour une checkbox
 */
export async function upsertLineItemCheck(check: LineItemCheckInsert) {
  const { data, error } = await supabase
    .from('line_item_checks')
    .upsert(check)
    .select()
    .single();

  if (error) throw error;
  return data as LineItemCheck;
}

/**
 * Met à jour l'état d'une checkbox
 */
export async function setLineItemChecked(checkId: string, checked: boolean) {
  const { data, error } = await supabase
    .from('line_item_checks')
    .update({ checked })
    .eq('id', checkId)
    .select()
    .single();

  if (error) throw error;
  return data as LineItemCheck;
}

/**
 * Toggle l'état d'une checkbox
 */
export async function toggleLineItemCheck(shopId: string, checkId: string, currentState: boolean) {
  return setLineItemChecked(checkId, !currentState);
}

/**
 * Coche toutes les checkboxes d'une commande
 */
export async function checkAllLineItems(shopId: string, orderId: string) {
  const { data, error } = await supabase
    .from('line_item_checks')
    .update({ checked: true })
    .eq('shop_id', shopId)
    .eq('order_id', orderId)
    .select();

  if (error) throw error;
  return data as LineItemCheck[];
}

/**
 * Décoche toutes les checkboxes d'une commande
 */
export async function uncheckAllLineItems(shopId: string, orderId: string) {
  const { data, error } = await supabase
    .from('line_item_checks')
    .update({ checked: false })
    .eq('shop_id', shopId)
    .eq('order_id', orderId)
    .select();

  if (error) throw error;
  return data as LineItemCheck[];
}

/**
 * Supprime toutes les checkboxes d'une commande
 */
export async function deleteAllLineItemChecks(shopId: string, orderId: string) {
  const { error } = await supabase
    .from('line_item_checks')
    .delete()
    .eq('shop_id', shopId)
    .eq('order_id', orderId);

  if (error) throw error;
}

/**
 * Supprime une checkbox spécifique
 */
export async function deleteLineItemCheck(checkId: string) {
  const { error } = await supabase
    .from('line_item_checks')
    .delete()
    .eq('id', checkId);

  if (error) throw error;
}

/**
 * Compte les checkboxes cochées pour une commande
 */
export async function countCheckedLineItems(shopId: string, orderId: string) {
  const { count, error } = await supabase
    .from('line_item_checks')
    .select('*', { count: 'exact', head: true })
    .eq('shop_id', shopId)
    .eq('order_id', orderId)
    .eq('checked', true);

  if (error) throw error;
  return count || 0;
}

/**
 * Récupère les checkboxes groupées par SKU/couleur/taille pour la page textile
 */
export async function getUncheckedLineItemsGrouped(shopId: string) {
  const { data, error } = await supabase
    .from('line_item_checks')
    .select('*')
    .eq('shop_id', shopId)
    .eq('checked', false);

  if (error) throw error;

  // Grouper par SKU + couleur + taille
  const grouped = (data as LineItemCheck[]).reduce((acc, item) => {
    const key = `${item.sku}--${item.color}--${item.size}`;
    if (!acc[key]) {
      acc[key] = {
        sku: item.sku,
        color: item.color,
        size: item.size,
        items: [],
        count: 0,
      };
    }
    acc[key].items.push(item);
    acc[key].count++;
    return acc;
  }, {} as Record<string, { sku: string; color: string; size: string; items: LineItemCheck[]; count: number }>);

  return Object.values(grouped);
}

/**
 * Initialise les checkboxes pour une commande à partir de ses line items
 */
export async function initLineItemChecksForOrder(
  shopId: string,
  orderId: string,
  lineItems: Array<{
    sku: string;
    color: string;
    size: string;
    productIndex: number;
    quantity: number;
  }>
) {
  const checks: LineItemCheckInsert[] = [];

  for (const item of lineItems) {
    for (let quantityIndex = 0; quantityIndex < item.quantity; quantityIndex++) {
      const checkId = `${orderId}--${item.sku}--${item.color}--${item.size}--${item.productIndex}--${quantityIndex}`;
      checks.push({
        id: checkId,
        shop_id: shopId,
        order_id: orderId,
        sku: item.sku,
        color: item.color,
        size: item.size,
        product_index: item.productIndex,
        quantity_index: quantityIndex,
        checked: false,
      });
    }
  }

  if (checks.length === 0) return [];

  const { data, error } = await supabase
    .from('line_item_checks')
    .upsert(checks, { onConflict: 'id' })
    .select();

  if (error) throw error;
  return data as LineItemCheck[];
}
