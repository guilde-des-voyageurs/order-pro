'use client';

import { Badge } from '@mantine/core';
import { useEffect, useState } from 'react';
import { db } from '@/firebase/config';
import { doc, onSnapshot } from 'firebase/firestore';

interface TextileProgressProps {
  orderId: string;
}

export function TextileProgress({ orderId }: TextileProgressProps) {
  const [progress, setProgress] = useState<{ checkedCount: number; totalCount: number } | null>(null);
  const [exists, setExists] = useState<boolean | null>(null);

  useEffect(() => {
    const docRef = doc(db, 'textile-progress', orderId);

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

    return () => unsubscribe();
  }, [orderId]);

  if (progress === null || exists === null) {
    return <Badge color="gray">-</Badge>;
  }

  if (!exists) {
    return <Badge color="violet">NEW</Badge>;
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
