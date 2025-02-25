import { useState, useEffect } from 'react';
import { db } from '@/firebase/config';
import { doc, onSnapshot, setDoc, writeBatch } from 'firebase/firestore';
import { encodeFirestoreId } from '@/utils/firebase-helpers';

export const useWeeklyBillingCheckboxes = (orderIds: string[]) => {
  const [checkedCount, setCheckedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderIds.length) {
      setCheckedCount(0);
      setLoading(false);
      return;
    }

    let currentCount = 0;
    const encodedOrderIds = orderIds.map(encodeFirestoreId);
    
    const unsubscribes = encodedOrderIds.map(encodedOrderId => {
      const docRef = doc(db, 'InvoiceStatus', encodedOrderId);
      return onSnapshot(docRef, (doc) => {
        if (doc.exists() && doc.data().invoiced) {
          currentCount++;
        } else {
          currentCount--;
        }
        setCheckedCount(Math.max(0, currentCount));
      });
    });

    setLoading(false);

    return () => {
      unsubscribes.forEach(unsubscribe => unsubscribe());
      setCheckedCount(0);
    };
  }, [orderIds]);

  const handleChange = async () => {
    if (!orderIds.length) return;
    
    // Si au moins une checkbox est cochée, on décoche tout
    const shouldCheck = checkedCount === 0;
    
    setLoading(true);
    try {
      const batch = writeBatch(db);
      const now = new Date().toISOString();

      orderIds.forEach(orderId => {
        const encodedOrderId = encodeFirestoreId(orderId);
        const docRef = doc(db, 'InvoiceStatus', encodedOrderId);
        
        batch.set(docRef, {
          orderId: orderId,
          invoiced: shouldCheck,
          updatedAt: now
        }, { merge: true });
      });

      await batch.commit();
    } catch (error) {
      console.error('Erreur lors de la mise à jour des statuts:', error);
    } finally {
      setLoading(false);
    }
  };

  return { 
    checked: checkedCount === orderIds.length,
    indeterminate: checkedCount > 0 && checkedCount < orderIds.length,
    loading,
    handleChange 
  };
};
