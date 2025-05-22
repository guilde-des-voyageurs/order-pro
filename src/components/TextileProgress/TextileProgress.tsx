'use client';

import { Badge, ActionIcon, Tooltip, Group } from '@mantine/core';
import { IconRefresh } from '@tabler/icons-react';
import styles from './TextileProgress.module.scss';
import { useEffect, useState } from 'react';
import { db } from '@/firebase/config';
import { doc, onSnapshot, getDoc, updateDoc } from 'firebase/firestore';

interface TextileProgressProps {
  orderId: string;
  onRefresh?: () => void;
}

export function TextileProgress({ orderId, onRefresh }: TextileProgressProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [progress, setProgress] = useState<{ checkedCount: number; totalCount: number } | null>(null);
  const [exists, setExists] = useState<boolean | null>(null);

  useEffect(() => {
    const docRef = doc(db, 'textile-progress-v2', orderId);

    const unsubscribe = onSnapshot(docRef, (doc) => {
      setExists(doc.exists());
      if (doc.exists()) {
        const data = doc.data();
        setProgress({
          checkedCount: data.checkedCount || 0,
          totalCount: data.totalCount || 0
        });
      } else {
        setProgress({ checkedCount: 0, totalCount: 0 });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [orderId]);

  if (progress === null || exists === null) {
    return <Badge className={styles.progress} variant="outline">-</Badge>;
  }

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);

    try {
      const docRef = doc(db, 'textile-progress-v2', orderId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        // Récupérer le nombre total de textiles depuis la commande
        const orderRef = doc(db, 'orders-v2', orderId);
        const orderSnap = await getDoc(orderRef);
        
        if (orderSnap.exists()) {
          const orderData = orderSnap.data();
          const lineItems = orderData.lineItems || [];
          const totalCount = lineItems.reduce((acc: number, item: any) => {
            // Ne pas compter les items annulés
            if (item.isCancelled) return acc;
            return acc + (item.quantity || 0);
          }, 0);
          
          // Mettre à jour le total dans textile-progress-v2
          await updateDoc(docRef, {
            totalCount
          });

          onRefresh?.();
        }
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
