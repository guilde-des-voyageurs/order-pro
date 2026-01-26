'use client';

import { Badge, ActionIcon, Tooltip, Group } from '@mantine/core';
import { IconRefresh } from '@tabler/icons-react';
import styles from './TextileProgress.module.scss';
import { useEffect, useState } from 'react';
import { supabase } from '@/supabase/client';
import { useShop } from '@/context/ShopContext';

interface TextileProgressProps {
  orderId: string;
  onRefresh?: () => void;
}

export function TextileProgress({ orderId, onRefresh }: TextileProgressProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [progress, setProgress] = useState<{ checkedCount: number; totalCount: number } | null>(null);
  const [exists, setExists] = useState<boolean | null>(null);
  const { currentShop } = useShop();

  useEffect(() => {
    if (!currentShop || !orderId) return;

    const loadProgress = async () => {
      const { data } = await supabase
        .from('order_progress')
        .select('total_count, checked_count')
        .eq('shop_id', currentShop.id)
        .eq('order_id', orderId)
        .single();

      if (data) {
        setExists(true);
        setProgress({
          checkedCount: data.checked_count || 0,
          totalCount: data.total_count || 0
        });
      } else {
        setExists(false);
        setProgress({ checkedCount: 0, totalCount: 0 });
      }
    };

    loadProgress();

    // Écouter les changements en temps réel
    const channel = supabase
      .channel(`progress-${orderId}`)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'order_progress', 
          filter: `order_id=eq.${orderId}` 
        },
        (payload) => {
          if (payload.new && 'checked_count' in payload.new) {
            setExists(true);
            setProgress({
              checkedCount: (payload.new as any).checked_count || 0,
              totalCount: (payload.new as any).total_count || 0
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, currentShop]);

  if (progress === null || exists === null) {
    return <Badge className={styles.progress} variant="outline">-</Badge>;
  }

  const handleRefresh = async () => {
    if (isRefreshing || !currentShop) return;
    setIsRefreshing(true);

    try {
      // Récupérer la commande depuis Supabase
      const { data: order } = await supabase
        .from('orders')
        .select('line_items')
        .eq('shop_id', currentShop.id)
        .eq('shopify_id', orderId)
        .single();
      
      if (order) {
        const lineItems = order.line_items || [];
        const totalCount = lineItems.reduce((acc: number, item: any) => {
          if (item.isCancelled) return acc;
          return acc + (item.quantity || 0);
        }, 0);
        
        // Mettre à jour le total dans order_progress
        await supabase
          .from('order_progress')
          .upsert({
            shop_id: currentShop.id,
            order_id: orderId,
            total_count: totalCount,
          }, { onConflict: 'shop_id,order_id' });

        onRefresh?.();
      }
    } catch (error) {
      console.error('Error refreshing textile count:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!exists) {
    return <Badge className={`${styles.progress} ${styles.new}`} variant="outline">NEW</Badge>;
  }

  const getProgressClass = () => {
    if (!exists) return 'new';
    if (progress.checkedCount === 0) return 'incomplete';
    if (progress.checkedCount === progress.totalCount) return 'complete';
    return 'incomplete';
  };

  return (
    <Group gap="xs">
      <Badge 
        className={`${styles.progress} ${styles[getProgressClass()]}`} 
        variant="outline"
        style={{ cursor: 'pointer' }}
        onClick={handleRefresh}
      >
        {progress.checkedCount}/{progress.totalCount}
      </Badge>
      {isRefreshing && (
        <Tooltip label="Recalcul en cours...">
          <ActionIcon size="sm" variant="subtle" loading>
            <IconRefresh size={16} />
          </ActionIcon>
        </Tooltip>
      )}
    </Group>
  );
}
