'use client';

import { Badge } from '@mantine/core';
import { useEffect, useState } from 'react';
import { db } from '@/firebase/config';
import { doc, onSnapshot } from 'firebase/firestore';
import { encodeFirestoreId } from '@/utils/firebase-helpers';

interface TextileProgressProps {
  orderId: string;
}

export function TextileProgress({ orderId }: TextileProgressProps) {
  const [progress, setProgress] = useState<{ checkedCount: number; totalCount: number } | null>(null);

  useEffect(() => {
    const encodedOrderId = encodeFirestoreId(orderId);
    const docRef = doc(db, 'orders-progress', encodedOrderId);

    const unsubscribe = onSnapshot(docRef, (doc) => {
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

    return () => unsubscribe();
  }, [orderId]);

  if (!progress) {
    return <Badge color="gray">-</Badge>;
  }

  const getColor = () => {
    if (progress.totalCount === 0) return 'gray';
    if (progress.checkedCount === 0) return '#d9734f';
    if (progress.checkedCount === progress.totalCount) return '#53c593';
    return 'yellow';
  };

  return (
    <Badge color={getColor()}>
      {progress.checkedCount} / {progress.totalCount}
    </Badge>
  );
}
