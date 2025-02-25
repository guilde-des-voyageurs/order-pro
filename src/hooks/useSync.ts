'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { syncService } from '@/services/sync';
import { useSettings } from './useSettings';

export function useSync() {
  const [syncStatus, setSyncStatus] = useState<{
    orders: 'idle' | 'syncing' | 'error';
    products: 'idle' | 'syncing' | 'error';
  }>({
    orders: 'idle',
    products: 'idle',
  });
  const [lastSync, setLastSync] = useState<{
    orders?: string;
    products?: string;
  }>({});
  const [error, setError] = useState<Error | null>(null);

  const { settings } = useSettings();

  useEffect(() => {
    const fetchLastSyncStatus = async () => {
      try {
        const [ordersSync, productsSync] = await Promise.all([
          syncService.getLastSyncStatus('orders'),
          syncService.getLastSyncStatus('products'),
        ]);

        setLastSync({
          orders: ordersSync?.completed_at,
          products: productsSync?.completed_at,
        });
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch sync status'));
      }
    };

    fetchLastSyncStatus();

    // Subscribe to sync_logs changes
    const syncLogsSubscription = supabase
      .channel('sync_logs_channel')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sync_logs'
        },
        async (payload) => {
          const { new: newLog } = payload;
          if (newLog) {
            if (newLog.status === 'pending') {
              setSyncStatus(prev => ({
                ...prev,
                [newLog.type]: 'syncing',
              }));
            } else {
              setSyncStatus(prev => ({
                ...prev,
                [newLog.type]: newLog.status === 'error' ? 'error' : 'idle',
              }));
              setLastSync(prev => ({
                ...prev,
                [newLog.type]: newLog.completed_at,
              }));
            }
          }
        }
      )
      .subscribe();

    return () => {
      syncLogsSubscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!settings?.sync_config.enabled) return;

    const ordersSyncInterval = setInterval(async () => {
      try {
        const isInProgress = await syncService.isSyncInProgress('orders');
        if (!isInProgress) {
          await syncService.syncData('orders');
        }
      } catch (err) {
        console.error('Auto sync orders error:', err);
      }
    }, settings.sync_config.orders_sync_interval_minutes * 60 * 1000);

    const productsSyncInterval = setInterval(async () => {
      try {
        const isInProgress = await syncService.isSyncInProgress('products');
        if (!isInProgress) {
          await syncService.syncData('products');
        }
      } catch (err) {
        console.error('Auto sync products error:', err);
      }
    }, settings.sync_config.products_sync_interval_minutes * 60 * 1000);

    return () => {
      clearInterval(ordersSyncInterval);
      clearInterval(productsSyncInterval);
    };
  }, [settings?.sync_config]);

  const syncOrders = async () => {
    try {
      await syncService.syncData('orders');
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to sync orders'));
      throw err;
    }
  };

  const syncProducts = async () => {
    try {
      await syncService.syncData('products');
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to sync products'));
      throw err;
    }
  };

  return {
    syncStatus,
    lastSync,
    error,
    syncOrders,
    syncProducts,
  };
}
