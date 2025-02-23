'use client';

import { Checkbox, Group, Text } from '@mantine/core';
import { useEffect, useState } from 'react';
import { db, auth } from '@/firebase/config';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { encodeFirestoreId } from '@/utils/firebase-helpers';
import { formatAmount } from '@/utils/format-helpers';

interface InvoiceCheckboxProps {
  orderId: string;
  totalAmount?: number;
  currency?: string;
}

export function InvoiceCheckbox({ orderId, totalAmount, currency }: InvoiceCheckboxProps) {
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;

    const encodedOrderId = encodeFirestoreId(orderId);
    const docRef = doc(db, 'InvoiceStatus', encodedOrderId);

    const unsubscribe = onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        setChecked(doc.data().invoiced || false);
      } else {
        setChecked(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [orderId]);

  const handleChange = async (checked: boolean) => {
    if (!auth.currentUser) return;

    const encodedOrderId = encodeFirestoreId(orderId);
    const docRef = doc(db, 'InvoiceStatus', encodedOrderId);

    await setDoc(docRef, {
      orderId: orderId,
      invoiced: checked,
      userId: auth.currentUser.uid,
      updatedAt: new Date().toISOString()
    });
  };

  if (loading) {
    return <Checkbox checked={false} disabled />;
  }

  return (
    <Group gap="xs" align="center">
      <Checkbox
        checked={checked}
        onChange={(event) => handleChange(event.currentTarget.checked)}
        label={totalAmount === undefined ? "Facturé" : undefined}
      />
      {totalAmount !== undefined && (
        <Text size="sm" fw={500}>{formatAmount(totalAmount)} {currency}</Text>
      )}
    </Group>
  );
}
