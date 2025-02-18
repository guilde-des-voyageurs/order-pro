'use client';

import { Group } from '@mantine/core';
import { Checkbox } from '@mantine/core';
import { useEffect, useState } from 'react';
import { db, auth } from '@/firebase/config';
import { doc, onSnapshot, setDoc, increment } from 'firebase/firestore';
import { encodeFirestoreId, decodeFirestoreId } from '@/utils/firestore-helpers';

interface VariantCheckboxProps {
  sku: string;
  color?: string;
  size?: string;
  quantity: number;
  className?: string;
  orderId: string;
  onChange?: (checked: boolean[]) => void;
}

interface VariantDocument {
  checked: boolean;
  sku: string;
  color?: string;
  size?: string;
  index: number;
  originalId: string;
  userId: string;
  updatedAt: string;
  orderId: string;
}

interface VariantId {
  sku: string;
  color: string | null;
  size: string | null;
  index: number;
}

const encodeVariantId = (
  sku: string, 
  color: string | null, 
  size: string | null, 
  index: number
): string => {
  const id = `${sku}--${color || 'no-color'}--${size || 'no-size'}--${index}`;
  return encodeFirestoreId(id);
};

const decodeVariantId = (encodedId: string): string => {
  return decodeFirestoreId(encodedId);
};

interface CheckboxState {
  checked: boolean;
  loading: boolean;
  error: string | null;
}

export const VariantCheckbox = ({ sku, color, size, quantity, className, orderId }: VariantCheckboxProps) => {
  const [checkboxes, setCheckboxes] = useState<CheckboxState[]>(
    Array(quantity).fill({ checked: false, loading: true, error: null })
  );

  useEffect(() => {
    if (!auth.currentUser) {
      setCheckboxes(prev => prev.map(checkbox => ({
        ...checkbox,
        loading: false,
        error: 'Utilisateur non connecté'
      })));
      return;
    }

    const unsubscribes = Array(quantity).fill(null).map((_, index) => {
      const variantId = encodeVariantId(sku, color, size, index);
      const docRef = doc(db, 'variants-ordered', encodeFirestoreId(variantId));
      
      return onSnapshot(docRef, (doc) => {
        setCheckboxes(prev => {
          const newState = [...prev];
          newState[index] = {
            checked: doc.exists() ? doc.data()?.checked || false : false,
            loading: false,
            error: null
          };
          return newState;
        });
      }, (error) => {
        setCheckboxes(prev => {
          const newState = [...prev];
          newState[index] = {
            ...prev[index],
            loading: false,
            error: error.message
          };
          return newState;
        });
      });
    });

    return () => unsubscribes.forEach(unsubscribe => unsubscribe?.());
  }, [sku, color, size, quantity]);

  const handleChange = async (index: number, checked: boolean) => {
    if (!auth.currentUser) {
      setCheckboxes(prev => {
        const newState = [...prev];
        newState[index] = {
          ...prev[index],
          error: 'Utilisateur non connecté'
        };
        return newState;
      });
      return;
    }

    try {
      setCheckboxes(prev => {
        const newState = [...prev];
        newState[index] = {
          ...prev[index],
          loading: true,
          error: null
        };
        return newState;
      });

      const variantId = encodeVariantId(sku, color, size, index);
      const docRef = doc(db, 'variants-ordered', encodeFirestoreId(variantId));
      const document: VariantDocument = {
        checked,
        sku,
        color,
        size,
        index,
        originalId: decodeVariantId(variantId),
        userId: auth.currentUser.uid,
        updatedAt: new Date().toISOString(),
        orderId
      };
      await setDoc(docRef, document);

      // Mettre à jour le compteur de la commande
      const orderRef = doc(db, 'orders-progress', orderId);
      await setDoc(orderRef, {
        userId: auth.currentUser.uid,
        updatedAt: new Date().toISOString(),
        checkedCount: increment(checked ? 1 : -1)
      }, { merge: true });

      setCheckboxes(prev => {
        const newState = [...prev];
        newState[index] = {
          checked,
          loading: false,
          error: null
        };
        return newState;
      });
    } catch (error) {
      setCheckboxes(prev => {
        const newState = [...prev];
        newState[index] = {
          ...prev[index],
          loading: false,
          error: error instanceof Error ? error.message : 'Erreur inconnue'
        };
        return newState;
      });
    }
  };

  if (checkboxes.every(c => c.error)) return null;

  return (
    <Group gap={4}>
      {checkboxes.map((checkbox, index) => (
        <Checkbox
          key={index}
          checked={checkbox.checked}
          onChange={(event) => handleChange(index, event.currentTarget.checked)}
          className={className}
          disabled={checkbox.loading}
        />
      ))}
    </Group>
  );
};
