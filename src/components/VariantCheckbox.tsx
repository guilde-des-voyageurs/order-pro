'use client';

import { Checkbox } from '@mantine/core';
import { useEffect, useState } from 'react';
import { db } from '@/firebase/config';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { ordersService } from '@/firebase/services/orders';
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
  disabled,

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
    await ordersService.updateCheckedCount(orderId);
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
  );
};
