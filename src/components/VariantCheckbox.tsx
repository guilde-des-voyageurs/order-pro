'use client';

import { Checkbox } from '@mantine/core';
import { useEffect, useState } from 'react';
import { db, auth } from '@/firebase/config';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

interface VariantCheckboxProps {
  sku: string;
  color?: string;
  size?: string;
  className?: string;
}

const encodeVariantId = (sku: string, color?: string, size?: string): string => {
  const id = `${sku}-${color || 'no-color'}-${size || 'no-size'}`;
  return Buffer.from(id).toString('base64').replace(/\//g, '_').replace(/\+/g, '-');
};

const decodeVariantId = (encodedId: string): string => {
  return Buffer.from(encodedId.replace(/_/g, '/').replace(/-/g, '+'), 'base64').toString();
};

export const VariantCheckbox = ({ sku, color, size, className }: VariantCheckboxProps) => {
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Créer un ID unique encodé pour cette variante
  const variantId = encodeVariantId(sku, color, size);

  useEffect(() => {
    if (!auth.currentUser) {
      setError('Utilisateur non connecté');
      setLoading(false);
      return;
    }

    const docRef = doc(db, 'variants-ordered', variantId);
    
    const unsubscribe = onSnapshot(docRef, (doc) => {
      setChecked(doc.exists() ? doc.data()?.checked || false : false);
      setLoading(false);
    }, (error) => {
      setError(error.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [variantId]);

  const handleChange = async (checked: boolean) => {
    if (!auth.currentUser) {
      setError('Utilisateur non connecté');
      return;
    }

    try {
      const docRef = doc(db, 'variants-ordered', variantId);
      await setDoc(docRef, { 
        checked,
        sku,
        color,
        size,
        originalId: decodeVariantId(variantId),
        userId: auth.currentUser.uid,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erreur inconnue');
    }
  };

  if (loading) return null;
  if (error) return null; // On pourrait aussi afficher une erreur si nécessaire

  return (
    <Checkbox
      checked={checked}
      onChange={(event) => handleChange(event.currentTarget.checked)}
      label="Variante commandée"
      className={className}
    />
  );
};
