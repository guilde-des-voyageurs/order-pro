import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';

export function useMonthlyBalance(month: string) {
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    if (!month) return;

    const balanceRef = doc(db, 'MonthlyBillingNotes', month);
    const unsubscribe = onSnapshot(balanceRef, (snapshot) => {
      if (snapshot.exists()) {
        setBalance(snapshot.data().balance || 0);
      } else {
        setBalance(0);
      }
    });

    return () => unsubscribe();
  }, [month]);

  const updateBalance = async (amount: number) => {
    if (!month) return;
    const balanceRef = doc(db, 'MonthlyBillingNotes', month);
    await setDoc(balanceRef, { balance: amount }, { merge: true });
  };

  return { balance, updateBalance };
}
