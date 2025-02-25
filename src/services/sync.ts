import { supabase } from '@/lib/supabase';
import { productsService } from './products';
import { ordersService } from './orders';
import { fetchOrdersApiAction } from '@/actions/fetch-orders-api-action';

interface SyncLog {
  id: string;
  type: 'orders' | 'products';
  status: 'pending' | 'success' | 'error';
  items_processed: number;
  items_succeeded: number;
  items_failed: number;
  error_message?: string;
  started_at: string;
  completed_at?: string;
  user_id: string;
}

export const syncService = {
  /**
   * Démarre une synchronisation
   */
  async startSync(type: SyncLog['type']): Promise<string> {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      throw new Error('User must be authenticated to start sync');
    }

    const { data, error } = await supabase
      .from('sync_logs')
      .insert({
        type,
        status: 'pending',
        items_processed: 0,
        items_succeeded: 0,
        items_failed: 0,
        started_at: new Date().toISOString(),
        user_id: session.user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error starting sync:', error);
      throw error;
    }

    return data.id;
  },

  /**
   * Met à jour le statut d'une synchronisation
   */
  async updateSyncStatus(
    id: string,
    updates: Partial<Omit<SyncLog, 'id' | 'type' | 'started_at' | 'user_id'>>
  ): Promise<void> {
    const { error } = await supabase
      .from('sync_logs')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('Error updating sync status:', error);
      throw error;
    }
  },

  /**
   * Récupère les logs de synchronisation
   */
  async getSyncLogs(type?: SyncLog['type']): Promise<SyncLog[]> {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      throw new Error('User must be authenticated to get sync logs');
    }

    let query = supabase
      .from('sync_logs')
      .select('*')
      .eq('user_id', session.user.id)
      .order('started_at', { ascending: false });

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error getting sync logs:', error);
      throw error;
    }

    return data;
  },

  /**
   * Récupère le dernier statut de synchronisation
   */
  async getLastSyncStatus(type: SyncLog['type']): Promise<SyncLog | null> {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      throw new Error('User must be authenticated to get sync status');
    }

    const { data, error } = await supabase
      .from('sync_logs')
      .select('*')
      .eq('type', type)
      .eq('user_id', session.user.id)
      .order('started_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error getting last sync status:', error);
      throw error;
    }

    return data;
  },

  /**
   * Synchronise les données depuis Shopify
   */
  async syncData(type: SyncLog['type']): Promise<void> {
    const syncId = await this.startSync(type);

    try {
      let itemsProcessed = 0;
      let itemsSucceeded = 0;
      let itemsFailed = 0;

      if (type === 'products') {
        const result = await productsService.syncProducts((progress) => {
          this.updateSyncStatus(syncId, {
            items_processed: progress.processed,
            items_succeeded: progress.succeeded,
            items_failed: progress.failed,
          });
        });

        itemsProcessed = result.processed;
        itemsSucceeded = result.succeeded;
        itemsFailed = result.failed;
      } else {
        // Récupérer les commandes depuis Shopify
        const orders = await fetchOrdersApiAction();
        console.log('Fetched orders:', orders);

        // Synchroniser les commandes
        await ordersService.syncOrders(orders);

        itemsProcessed = orders.length;
        itemsSucceeded = orders.length;
        itemsFailed = 0;
      }

      await this.updateSyncStatus(syncId, {
        status: 'success',
        items_processed: itemsProcessed,
        items_succeeded: itemsSucceeded,
        items_failed: itemsFailed,
        completed_at: new Date().toISOString(),
      });
    } catch (error) {
      await this.updateSyncStatus(syncId, {
        status: 'error',
        error_message: error instanceof Error ? error.message : 'Unknown error occurred',
        completed_at: new Date().toISOString(),
      });
      throw error;
    }
  },

  /**
   * Vérifie si une synchronisation est en cours
   */
  async isSyncInProgress(type: SyncLog['type']): Promise<boolean> {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      throw new Error('User must be authenticated to check sync status');
    }

    const { data, error } = await supabase
      .from('sync_logs')
      .select('*')
      .eq('type', type)
      .eq('user_id', session.user.id)
      .eq('status', 'pending')
      .maybeSingle();

    if (error) {
      console.error('Error checking sync status:', error);
      throw error;
    }

    return !!data;
  },
};
