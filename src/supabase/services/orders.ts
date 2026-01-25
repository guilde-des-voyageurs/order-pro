import { supabase } from '../client';
import type { Order } from '../types';

/**
 * Récupère toutes les commandes d'une boutique
 */
export async function getOrders(shopId: string) {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Order[];
}

/**
 * Récupère les commandes clients (non-batch) en cours
 */
export async function getPendingClientOrders(shopId: string) {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('shop_id', shopId)
    .neq('display_fulfillment_status', 'FULFILLED')
    .neq('display_financial_status', 'REFUNDED')
    .order('created_at', { ascending: false });

  if (error) throw error;
  
  // Filtrer les commandes batch côté client
  return (data as Order[]).filter(order => 
    !order.tags?.some(tag => tag.toLowerCase().includes('batch'))
  );
}

/**
 * Récupère les commandes batch en cours
 */
export async function getPendingBatchOrders(shopId: string) {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('shop_id', shopId)
    .neq('display_fulfillment_status', 'FULFILLED')
    .neq('display_financial_status', 'REFUNDED')
    .order('created_at', { ascending: false });

  if (error) throw error;
  
  // Filtrer pour ne garder que les commandes batch
  return (data as Order[]).filter(order => 
    order.tags?.some(tag => tag.toLowerCase().includes('batch'))
  );
}

/**
 * Récupère les commandes archivées (fulfilled)
 */
export async function getArchivedOrders(shopId: string, isBatch: boolean = false) {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('shop_id', shopId)
    .eq('display_fulfillment_status', 'FULFILLED')
    .order('created_at', { ascending: false });

  if (error) throw error;
  
  return (data as Order[]).filter(order => {
    const hasBatchTag = order.tags?.some(tag => tag.toLowerCase().includes('batch'));
    return isBatch ? hasBatchTag : !hasBatchTag;
  });
}

/**
 * Récupère une commande par son ID
 */
export async function getOrderById(shopId: string, orderId: string) {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('shop_id', shopId)
    .eq('id', orderId)
    .single();

  if (error) throw error;
  return data as Order;
}

/**
 * Récupère une commande par son shopify_id
 */
export async function getOrderByShopifyId(shopId: string, shopifyId: string) {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('shop_id', shopId)
    .eq('shopify_id', shopifyId)
    .single();

  if (error) return null;
  return data as Order;
}

/**
 * Crée ou met à jour une commande (upsert)
 */
export async function upsertOrder(order: Record<string, unknown>) {
  const { data, error } = await supabase
    .from('orders')
    .upsert(order, { onConflict: 'shop_id,shopify_id' })
    .select()
    .single();

  if (error) throw error;
  return data as Order;
}

/**
 * Synchronise plusieurs commandes (bulk upsert)
 */
export async function syncOrders(shopId: string, orders: Record<string, unknown>[]) {
  const ordersWithShopId = orders.map(order => ({
    ...order,
    shop_id: shopId,
  }));

  const { data, error } = await supabase
    .from('orders')
    .upsert(ordersWithShopId, { onConflict: 'shop_id,shopify_id' })
    .select();

  if (error) throw error;
  return data as Order[];
}

/**
 * Met à jour le statut d'une commande
 */
export async function updateOrderStatus(
  shopId: string, 
  shopifyId: string, 
  status: { display_fulfillment_status?: string; display_financial_status?: string }
) {
  const { data, error } = await supabase
    .from('orders')
    .update(status)
    .eq('shop_id', shopId)
    .eq('shopify_id', shopifyId)
    .select()
    .single();

  if (error) throw error;
  return data as Order;
}

/**
 * Marque une commande comme expédiée (fulfilled)
 */
export async function markOrderAsFulfilled(shopId: string, shopifyId: string) {
  return updateOrderStatus(shopId, shopifyId, { 
    display_fulfillment_status: 'FULFILLED' 
  });
}

/**
 * Supprime une commande
 */
export async function deleteOrder(shopId: string, orderId: string) {
  const { error } = await supabase
    .from('orders')
    .delete()
    .eq('shop_id', shopId)
    .eq('id', orderId);

  if (error) throw error;
}

/**
 * Récupère les commandes pour la facturation d'un mois donné
 */
export async function getOrdersForBilling(shopId: string, month: string, isBatch: boolean = false) {
  // month format: YYYY-MM
  const startDate = `${month}-01`;
  const endDate = new Date(parseInt(month.split('-')[0]), parseInt(month.split('-')[1]), 0)
    .toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('shop_id', shopId)
    .gte('created_at', startDate)
    .lte('created_at', `${endDate}T23:59:59`)
    .order('created_at', { ascending: true });

  if (error) throw error;

  return (data as Order[]).filter(order => {
    const hasBatchTag = order.tags?.some(tag => tag.toLowerCase().includes('batch'));
    return isBatch ? hasBatchTag : !hasBatchTag;
  });
}

/**
 * Initialise la progression d'une commande
 */
export async function initOrderProgress(shopId: string, orderId: string, totalCount: number) {
  const { error } = await supabase
    .from('order_progress')
    .upsert({
      shop_id: shopId,
      order_id: orderId,
      total_count: totalCount,
      checked_count: 0,
    }, { onConflict: 'shop_id,order_id' });

  if (error) throw error;
}

/**
 * Met à jour le compteur de progression d'une commande
 */
export async function updateOrderProgress(shopId: string, orderId: string, checkedCount: number) {
  const { error } = await supabase
    .from('order_progress')
    .update({ checked_count: checkedCount })
    .eq('shop_id', shopId)
    .eq('order_id', orderId);

  if (error) throw error;
}

/**
 * Récupère la progression d'une commande
 */
export async function getOrderProgress(shopId: string, orderId: string) {
  const { data, error } = await supabase
    .from('order_progress')
    .select('*')
    .eq('shop_id', shopId)
    .eq('order_id', orderId)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
  return data;
}
