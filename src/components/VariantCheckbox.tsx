'use client';

import { Checkbox, Group } from '@mantine/core';
import { useEffect, useState } from 'react';
import { db, auth } from '@/firebase/config';
import { doc, onSnapshot, setDoc, increment } from 'firebase/firestore';
import { encodeFirestoreId } from '@/utils/firestore-helpers';

interface VariantCheckboxProps {
  sku: string;
  color: string | null;
  size: string | null;
  quantity: number;
  orderId: string;
  productIndex: number;
  variantId: string;
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
  const [checkboxState, setCheckboxState] = useState<CheckboxState>({
    checked: false,
    loading: true,
    error: null
  });

  useEffect(() => {
    if (!auth.currentUser) return;

    const docRef = doc(db, 'variants-ordered', variantId);
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      setCheckboxState({
        checked: snapshot.exists() ? snapshot.data()?.checked ?? false : false,
        loading: false,
        error: null
      });
    }, (error) => {
      console.error('Error fetching variant state:', error);
      setCheckboxState({
        checked: false,
        loading: false,
        error: 'Erreur lors du chargement'
      });
    });

    return () => unsubscribe();
  }, [variantId]);

  const handleChange = async (checked: boolean) => {
    if (!auth.currentUser) {
      setCheckboxState(prev => ({
        ...prev,
        error: 'Utilisateur non connecté'
      }));
      return;
    }

    try {
      setCheckboxState(prev => ({
        ...prev,
        loading: true,
        error: null
      }));

      console.log('Mise à jour de la variante:', {
        variantId,
        orderId,
        sku,
        color,
        size,
        productIndex,
        checked
      });

      const docRef = doc(db, 'variants-ordered', variantId);
      const document: VariantDocument = {
        checked,
        sku,
        color,
        size,
        index: productIndex,
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

      setCheckboxState(prev => ({
        ...prev,
        checked,
        loading: false,
        error: null
      }));
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      setCheckboxState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      }));
    }
  };

  return (
    <Checkbox
      checked={checkboxState.checked}
      onChange={(event) => handleChange(event.currentTarget.checked)}
      disabled={checkboxState.loading}
      className={className}
      size="xs"
    />
  );
};
