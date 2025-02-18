'use client';

import { Group } from '@mantine/core';
import { Checkbox } from '@mantine/core';
import { useEffect, useState } from 'react';
import { db, auth } from '@/firebase/config';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

interface VariantCheckboxProps {
  sku: string;
  color?: string;
  size?: string;
  quantity: number;
  className?: string;
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
}

const encodeVariantId = (sku: string, color?: string, size?: string, index: number): string => {
  const id = `${sku}-${color || 'no-color'}-${size || 'no-size'}-${index}`;
  return Buffer.from(id).toString('base64').replace(/\//g, '_').replace(/\+/g, '-');
};

const decodeVariantId = (encodedId: string): string => {
  return Buffer.from(encodedId.replace(/_/g, '/').replace(/-/g, '+'), 'base64').toString();
};

interface CheckboxState {
  checked: boolean;
  loading: boolean;
  error: string | null;
}

export const VariantCheckbox = ({ sku, color, size, quantity, className }: VariantCheckboxProps) => {
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
      const docRef = doc(db, 'variants-ordered', variantId);
      
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
      const variantId = encodeVariantId(sku, color, size, index);
      const docRef = doc(db, 'variants-ordered', variantId);
      const document: VariantDocument = {
        checked,
        sku,
        color,
        size,
        index,
        originalId: decodeVariantId(variantId),
        userId: auth.currentUser.uid,
        updatedAt: new Date().toISOString()
      };
      await setDoc(docRef, document);
    } catch (error) {
      setCheckboxes(prev => {
        const newState = [...prev];
        newState[index] = {
          ...prev[index],
          error: error instanceof Error ? error.message : 'Erreur inconnue'
        };
        return newState;
      });
    }
  };

  if (checkboxes.every(c => c.error)) return null;

  return (
    <Group gap={4}>
      {checkboxes.map((checkbox, index) => 
        !checkbox.loading && !checkbox.error && (
          <Checkbox
            key={index}
            checked={checkbox.checked}
            onChange={(event) => handleChange(index, event.currentTarget.checked)}
            className={className}
          />
        )
      )}
    </Group>
  );
};
