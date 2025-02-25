import { useEffect, useState } from 'react';
import { db } from '@/firebase/config';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { encodeFirestoreId } from '@/utils/firebase-helpers';

export const useBillingCheckbox = (orderId: string) => {
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const encodedOrderId = encodeFirestoreId(orderId);
    const docRef = doc(db, 'InvoiceStatus', encodedOrderId);

    const unsubscribe = onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        setChecked(doc.data().invoiced || false);
      } else {
        setChecked(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [orderId]);

  const handleChange = async (checked: boolean) => {
    setLoading(true);
    try {
      const encodedOrderId = encodeFirestoreId(orderId);
      const docRef = doc(db, 'InvoiceStatus', encodedOrderId);

      await setDoc(docRef, {
        orderId: orderId,
        invoiced: checked,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      // Remettre l'état précédent en cas d'erreur
      setChecked(!checked);
    } finally {
      setLoading(false);
    }
  };

  return { checked, loading, handleChange };
};
