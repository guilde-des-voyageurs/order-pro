import { useState, useEffect } from 'react';
import { db } from '@/firebase/config';
import { doc, onSnapshot, setDoc, writeBatch } from 'firebase/firestore';
import { encodeFirestoreId } from '@/utils/firebase-helpers';

export const useWeeklyBillingCheckboxes = (orderIds: string[]) => {
  const [checkedStates, setCheckedStates] = useState<Map<string, boolean>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderIds.length) {
      setCheckedStates(new Map());
      setLoading(false);
      return;
    }

    const encodedOrderIds = orderIds.map(encodeFirestoreId);
    
    // Créer une référence pour chaque document
    const docRefs = encodedOrderIds.map(id => doc(db, 'InvoiceStatus', id));
    
    // Écouter les changements sur tous les documents
    const unsubscribes = docRefs.map((docRef, index) => 
      onSnapshot(docRef, (snapshot) => {
        const docData = snapshot.data();
        const isInvoiced = docData?.invoiced || false;
        const encodedId = encodedOrderIds[index];
        
        setCheckedStates(prev => {
          const next = new Map(prev);
          next.set(encodedId, isInvoiced);
          return next;
        });
      })
    );

    setLoading(false);

    return () => {
      unsubscribes.forEach(unsubscribe => unsubscribe());
      setCheckedStates(new Map());
    };
  }, [orderIds]);

  const checkedCount = Array.from(checkedStates.values()).filter(Boolean).length;
  const checked = orderIds.length > 0 && checkedCount === orderIds.length;
  const indeterminate = checkedCount > 0 && checkedCount < orderIds.length;

  const handleChange = async () => {
    if (!orderIds.length) return;
    
    // Si au moins une checkbox est cochée, on décoche tout
    const shouldCheck = checkedCount < orderIds.length;
    
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
    checked,
    indeterminate,
    loading,
    handleChange 
  };
};
