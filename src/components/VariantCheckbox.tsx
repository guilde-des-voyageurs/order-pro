'use client';

import { Checkbox, Group, Text } from '@mantine/core';
import { useEffect, useState } from 'react';
import { db } from '@/firebase/config';
import { doc, onSnapshot, setDoc, getDoc, increment } from 'firebase/firestore';
import { encodeFirestoreId } from '@/utils/firebase-helpers';
import { useHasMounted } from '@/hooks/useHasMounted';
import { useCheckedVariants } from '@/hooks/useCheckedVariants';

interface VariantCheckboxProps {
  sku: string;
  color: string;
  size: string;
  quantity: number;
  orderId: string;
  productIndex: number;
  variantId: string;
  className?: string;
  disabled?: boolean;
}

interface VariantDocument {
  checked: boolean;
  sku: string;
  color: string;
  size: string;
  originalId: string;
  updatedAt: string;
  orderId: string;
}

export const VariantCheckbox = ({ 
  sku, 
  color, 
  size, 
  quantity,
  orderId,
  productIndex,
  variantId,
  className,
  disabled
}: VariantCheckboxProps) => {
  const [checked, setChecked] = useState(false);
  const hasMounted = useHasMounted();

  useEffect(() => {
    if (!hasMounted) return;

    // Écouter les changements de la variante
    const variantRef = doc(db, 'variants-ordered-v2', variantId);
    const unsubscribe = onSnapshot(variantRef, (doc) => {
      if (doc.exists()) {
        setChecked(doc.data()?.checked || false);
      }
    });

    return () => unsubscribe();
  }, [variantId, hasMounted]);

  const handleCheckboxChange = async (event: any) => {
    const newChecked = event.target.checked;
    setChecked(newChecked);

    const encodedOrderId = encodeFirestoreId(orderId);
    const document: VariantDocument = {
      checked: newChecked,
      sku,
      color: color || 'no-color',
      size: size || 'no-size',
      originalId: orderId,
      updatedAt: new Date().toISOString(),
      orderId: encodedOrderId
    };

    // Mettre à jour le document de la variante
    const variantRef = doc(db, 'variants-ordered-v2', variantId);
    await setDoc(variantRef, document);

    // Mettre à jour le compteur de la commande
    const orderRef = doc(db, 'textile-progress-v2', encodedOrderId);
    await setDoc(orderRef, {
      checkedCount: increment(newChecked ? 1 : -1),
      updatedAt: new Date().toISOString()
    }, { merge: true });
  };

  // Rendu côté serveur
  if (typeof window === 'undefined') {
    return (
      <Checkbox
        checked={false}
        onChange={() => {}}
        disabled
      />
    );
  }

  // Utiliser le hook pour obtenir le nombre total de variantes cochées
  const checkedCount = useCheckedVariants({ sku, color, size });

  // Rendu côté client
  return (
    <Group gap={4} wrap="nowrap">
      <Checkbox
        checked={checked}
        onChange={handleCheckboxChange}
        disabled={disabled}
        className={className}
        styles={{
          root: {
            margin: 0,
            padding: 0,
            display: 'inline-flex'
          },
          inner: {
            margin: 0
          },
          body: {
            display: 'inline-flex',
            alignItems: 'center'
          }
        }}
      />
      {checkedCount > 0 && (
        <Text size="xs" c="dimmed" fw={500}>
          ({checkedCount})
        </Text>
      )}
    </Group>
  );
};
