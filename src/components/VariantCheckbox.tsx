'use client';

import { Checkbox } from '@mantine/core';
import { useEffect, useState } from 'react';
import { db } from '@/firebase/config';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { ordersService } from '@/firebase/services/orders';
import { encodeFirestoreId } from '@/utils/firebase-helpers';
import { useHasMounted } from '@/hooks/useHasMounted';
import { generateVariantId } from '@/utils/variant-helpers';
import { transformColor } from '@/utils/color-transformer';


interface VariantCheckboxProps {
  sku: string;
  color: string;
  size: string;
  quantity: number;
  orderId: string;
  productIndex: number;
  quantityIndex?: number;
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
  quantityIndex,
  className,
  disabled,
  variantId
}: VariantCheckboxProps) => {

  const [checked, setChecked] = useState(false);
  const hasMounted = useHasMounted();

  useEffect(() => {
    if (!hasMounted) return;

    console.log('VariantCheckbox mounted for:', { variantId, sku, color, size });

    // Écouter les changements de la variante
    const variantRef = doc(db, 'variants-ordered-v2', variantId);
    const unsubscribe = onSnapshot(variantRef, (doc) => {
      console.log('VariantCheckbox snapshot:', { variantId, exists: doc.exists(), data: doc.data() });
      if (doc.exists()) {
        const isChecked = doc.data()?.checked || false;
        console.log('Setting checkbox state:', { variantId, isChecked });
        setChecked(isChecked);
      }
    });

    return () => {
      console.log('VariantCheckbox unmounting:', { variantId });
      unsubscribe();
    };
  }, [variantId, hasMounted, sku, color, size]);

  const handleCheckboxChange = async (event: any) => {
    const newChecked = event.target.checked;
    console.log('Checkbox clicked:', { variantId, newChecked });
    
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

    try {
      console.log('Updating variant in Firestore:', { variantId, document });
      const variantRef = doc(db, 'variants-ordered-v2', variantId);
      await setDoc(variantRef, document);
      console.log('Variant updated successfully:', { variantId });

      // Une fois que le document est mis à jour, mettre à jour le compteur
      await ordersService.updateCheckedCount(orderId);
      console.log('Order checked count updated:', { orderId });
      
      // Note: pas besoin de setChecked ici car le onSnapshot va le faire
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', { variantId, error });
    }
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
