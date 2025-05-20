'use client';

import { Badge } from '@mantine/core';
import styles from './TextileProgress.module.scss';
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
    <Badge className={`${styles.progress} ${styles[getProgressClass()]}`} variant="outline">
      {progress.checkedCount} / {progress.totalCount}
    </Badge>
  );
}
