import { useState, useEffect } from 'react';
import { NumberInput } from '@mantine/core';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/firebase/db';
import { notifications } from '@mantine/notifications';

interface LineItemBalanceProps {
  orderId: string;
  sku: string;
  total: number;
}

export function LineItemBalance({ orderId, sku, total }: LineItemBalanceProps) {
  const [balance, setBalance] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchBalance = async () => {
      const balanceDoc = await getDoc(doc(db, 'LineItemBalance', `${orderId}_${sku}`));
      if (balanceDoc.exists()) {
        setBalance(balanceDoc.data().balance || 0);
      } else {
        setBalance(total);
      }
    };
    fetchBalance();
  }, [orderId, sku, total]);

  const saveBalance = async (value: number) => {
    try {
      setIsSaving(true);
      await setDoc(doc(db, 'LineItemBalance', `${orderId}_${sku}`), {
        balance: value,
        updatedAt: new Date().toISOString()
      });
      notifications.show({
        title: 'Succès',
        message: 'Balance enregistrée',
        color: 'green'
      });
    } catch (error) {
      console.error('Error saving balance:', error);
      notifications.show({
        title: 'Erreur',
        message: 'Erreur lors de l\'enregistrement de la balance',
        color: 'red'
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <NumberInput
      value={balance}
      onChange={(value) => {
        const numValue = typeof value === 'number' ? value : 0;
        setBalance(numValue);
        saveBalance(numValue);
      }}
      size="xs"
      suffix=" €"
      disabled={isSaving}
    />
  );
}
