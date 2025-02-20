'use client';

import { Checkbox, Group } from '@mantine/core';
import { useEffect, useState } from 'react';
import { db, auth } from '@/firebase/config';
import { doc, onSnapshot, setDoc, increment } from 'firebase/firestore';
import { encodeFirestoreId, decodeFirestoreId } from '@/utils/firestore-helpers';
import { useHasMounted } from '@/hooks/useHasMounted';

interface VariantCheckboxProps {
  sku: string;
  color: string | null;
  size: string | null;
  quantity: number;
  orderId: string;
  productIndex: number;
  className?: string;
}

interface CheckboxState {
  checked: boolean;
  loading: boolean;
  error: string | null;
}

interface VariantDocument {
  checked: boolean;
  sku: string;
  color: string | null;
  size: string | null;
  index: number;
  productIndex: number;
  originalId: string;
  userId: string;
  updatedAt: string;
  orderId: string;
}

const generateVariantId = (
  orderId: string,
  sku: string, 
  color: string | null, 
  size: string | null,
  productIndex: number,
  index: number
): string => {
  const id = `${orderId}--${sku}--${color || 'no-color'}--${size || 'no-size'}--${productIndex}--${index}`;
  return encodeFirestoreId(id);
};

export const VariantCheckbox = ({ 
  sku, 
  color, 
  size, 
  quantity,
  orderId,
  productIndex,
  className 
}: VariantCheckboxProps) => {
  const hasMounted = useHasMounted();
  const [checkboxes, setCheckboxes] = useState<CheckboxState[]>(
    Array(quantity).fill({ checked: false, loading: true, error: null })
  );

  useEffect(() => {
    if (!auth.currentUser || !hasMounted) return;

    // Réinitialiser l'état quand les props changent
    setCheckboxes(Array(quantity).fill({ checked: false, loading: true, error: null }));

    const unsubscribes = Array(quantity).fill(null).map((_, index) => {
      const variantId = generateVariantId(orderId, sku, color, size, productIndex, index);
      const docRef = doc(db, 'variants-ordered', variantId);

      return onSnapshot(docRef, (snapshot) => {
        setCheckboxes(prev => {
          const newState = [...prev];
          newState[index] = {
            checked: snapshot.exists() ? snapshot.data()?.checked ?? false : false,
            loading: false,
            error: null
          };
          return newState;
        });
      }, (error) => {
        console.error('Error fetching variant state:', error);
        setCheckboxes(prev => {
          const newState = [...prev];
          newState[index] = {
            ...prev[index],
            loading: false,
            error: 'Erreur lors du chargement'
          };
          return newState;
        });
      });
    });

    return () => unsubscribes.forEach(unsubscribe => unsubscribe());
  }, [sku, color, size, quantity, orderId, productIndex, hasMounted]);

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

      const variantId = generateVariantId(orderId, sku, color, size, productIndex, index);
      const docRef = doc(db, 'variants-ordered', variantId);
      const document: VariantDocument = {
        checked,
        sku,
        color,
        size,
        index,
        productIndex,
        originalId: decodeFirestoreId(variantId),
        userId: auth.currentUser.uid,
        updatedAt: new Date().toISOString(),
        orderId
      };
      await setDoc(docRef, document);

      // Mettre à jour le compteur de la commande
      const encodedOrderId = encodeFirestoreId(orderId);
      const orderRef = doc(db, 'orders-progress', encodedOrderId);
      await setDoc(orderRef, {
        userId: auth.currentUser.uid,
        updatedAt: new Date().toISOString(),
        checkedCount: increment(checked ? 1 : -1)
      }, { merge: true });

      // Mettre à jour l'état local après le succès
      setCheckboxes(prev => {
        const newState = [...prev];
        newState[index] = {
          ...prev[index],
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

  if (!hasMounted) {
    return (
      <Group gap={4}>
        {Array(quantity).fill(null).map((_, index) => (
          <Checkbox
            key={`${orderId}-${sku}-${color}-${size}-${productIndex}-${index}`}
            checked={false}
            disabled
            className={className}
          />
        ))}
      </Group>
    );
  }

  return (
    <Group gap={4}>
      {checkboxes.map((state, index) => (
        <Checkbox
          key={index}
          checked={state.checked}
          onChange={(event) => handleChange(index, event.currentTarget.checked)}
          disabled={state.loading || !!state.error}
          className={className}
          styles={{
            input: {
              cursor: state.loading ? 'wait' : state.error ? 'not-allowed' : 'pointer'
            }
          }}
        />
      ))}
    </Group>
  );
};
