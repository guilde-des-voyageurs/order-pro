'use client';

import { Checkbox, Group } from '@mantine/core';
import { useEffect, useState } from 'react';
import { db, auth } from '@/firebase/config';
import { doc, onSnapshot, setDoc, getDoc, increment } from 'firebase/firestore';
import { encodeFirestoreId } from '@/utils/firebase-helpers';
import { useHasMounted } from '@/hooks/useHasMounted';

interface VariantCheckboxProps {
  sku: string;
  color: string;
  size: string;
  quantity: number;
  orderId: string;
  productIndex: number;
  variantId: string;
  className?: string;
}

interface VariantDocument {
  checked: boolean;
  sku: string;
  color: string;
  size: string;
  productIndex: number;
  originalId: string;
  userId: string;
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
  className 
}: VariantCheckboxProps) => {
  const [checked, setChecked] = useState(false);
  const hasMounted = useHasMounted();

  useEffect(() => {
    if (!auth.currentUser || !hasMounted) return;

    // Écouter les changements de la variante
    const variantRef = doc(db, 'variants-ordered', variantId);
    const unsubscribe = onSnapshot(variantRef, (doc) => {
      if (doc.exists()) {
        setChecked(doc.data()?.checked || false);
      }
    });

    return () => unsubscribe();
  }, [variantId, hasMounted]);

  const handleCheckboxChange = async (event: any) => {
    if (!auth.currentUser) return;

    const newChecked = event.target.checked;
    setChecked(newChecked);

    const encodedOrderId = encodeFirestoreId(orderId);
    const document: VariantDocument = {
      checked: newChecked,
      sku,
      color,
      size,
      productIndex,
      originalId: orderId,
      userId: auth.currentUser.uid,
      updatedAt: new Date().toISOString(),
      orderId: encodedOrderId
    };

    // Mettre à jour le document de la variante
    const variantRef = doc(db, 'variants-ordered', variantId);
    await setDoc(variantRef, document);

    // Mettre à jour le compteur de la commande
    const orderRef = doc(db, 'textile-progress', encodedOrderId);
    await setDoc(orderRef, {
      checkedCount: increment(newChecked ? 1 : -1),
      userId: auth.currentUser.uid,
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

  // Rendu côté client
  return (
    <Checkbox
      checked={checked}
      onChange={handleCheckboxChange}
      disabled={!auth.currentUser}
      styles={{
        root: {
          margin: 0,
          padding: 0,
          marginRight: 2
        },
        inner: {
          margin: 0
        }
      }}
    />
  );
};
