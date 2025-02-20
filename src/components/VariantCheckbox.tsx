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
  // S'assurer que l'ID de la commande est déjà encodé
  const encodedOrderId = orderId.includes('--') ? orderId : encodeFirestoreId(orderId);
  const id = `${encodedOrderId}--${sku}--${color || 'no-color'}--${size || 'no-size'}--${productIndex}--${index}`;
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
      console.log('Mise à jour de la variante:', {
        variantId,
        orderId,
        sku,
        color,
        size,
        productIndex,
        index,
        checked
      });

      const docRef = doc(db, 'variants-ordered', variantId);
      const document: VariantDocument = {
        checked,
        sku,
        color,
        size,
        index,
        productIndex,
        originalId: orderId,
        userId: auth.currentUser.uid,
        updatedAt: new Date().toISOString(),
        orderId
      };

      console.log('Document à sauvegarder:', document);
      await setDoc(docRef, document);
      console.log('Document sauvegardé avec succès');

      // Mettre à jour le compteur de la commande
      const encodedOrderId = encodeFirestoreId(orderId);
      const orderRef = doc(db, 'orders-progress', encodedOrderId);
      console.log('Mise à jour du compteur:', {
        orderId: encodedOrderId,
        increment: checked ? 1 : -1
      });

      await setDoc(orderRef, {
        userId: auth.currentUser.uid,
        updatedAt: new Date().toISOString(),
        checkedCount: increment(checked ? 1 : -1)
      }, { merge: true });
      console.log('Compteur mis à jour avec succès');

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
      console.error('Erreur lors de la mise à jour:', error);
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
