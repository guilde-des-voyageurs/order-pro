import { supabase } from '@/lib/supabase';
import type { OrderRecord } from '@/lib/supabase';
import type { ShopifyOrder } from '@/types/shopify';
import { shopifyToSupabaseOrder, supabaseToShopifyOrder } from '@/utils/supabase-helpers';

export const ordersService = {
  /**
   * Synchronise les commandes Shopify avec Supabase
   */
  async syncOrders(orders: ShopifyOrder[]): Promise<void> {
    console.log('Starting sync with orders:', orders.length);

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      throw new Error('User must be authenticated to sync orders');
    }

    // Convertir les commandes au format Supabase
    const orderRecords = orders.map(order => ({
      ...shopifyToSupabaseOrder(order),
      user_id: session.user.id,
    }));

    // Insérer ou mettre à jour les commandes dans Supabase
    const { error } = await supabase
      .from('orders')
      .upsert(orderRecords, {
        onConflict: 'id',
        ignoreDuplicates: false,
      });

    if (error) {
      console.error('Error syncing orders:', error);
      throw error;
    }

    // Log de synchronisation
    await supabase
      .from('sync_logs')
      .insert({
        type: 'orders',
        status: 'success',
        items_processed: orders.length,
        items_succeeded: orders.length,
        completed_at: new Date().toISOString(),
      });
  },

  /**
   * Récupère toutes les commandes
   */
  async getOrders(): Promise<ShopifyOrder[]> {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      throw new Error('User must be authenticated to get orders');
    }

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }

    return data.map(supabaseToShopifyOrder);
  },

  /**
   * Récupère une commande par son ID
   */
  async getOrderById(id: string): Promise<ShopifyOrder | null> {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      throw new Error('User must be authenticated to get order');
    }

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .eq('user_id', session.user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching order:', error);
      throw error;
    }

    return supabaseToShopifyOrder(data);
  },

  /**
   * Supprime les anciennes commandes (plus de 6 mois)
   */
  async cleanupOldOrders(): Promise<void> {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      throw new Error('User must be authenticated to cleanup orders');
    }

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('user_id', session.user.id)
      .lt('created_at', sixMonthsAgo.toISOString());

    if (error) {
      console.error('Error cleaning up old orders:', error);
      throw error;
    }
  },
};
