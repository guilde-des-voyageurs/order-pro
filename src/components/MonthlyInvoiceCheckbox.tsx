import { useState } from 'react';
import { Checkbox, Group } from '@mantine/core';
import { doc, writeBatch } from 'firebase/firestore';
import { db } from '@/firebase/db';

interface MonthlyInvoiceCheckboxProps {
  orders: Array<{
    id: string;
  }>;
}

export function MonthlyInvoiceCheckbox({ orders }: MonthlyInvoiceCheckboxProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckAll = async (checked: boolean) => {
    setIsLoading(true);
    try {
      const batch = writeBatch(db);
      
      orders.forEach(order => {
        const docRef = doc(db, 'orders-v2', order.id);
        batch.update(docRef, {
          invoiced: checked
        });
      });

      await batch.commit();
    } catch (error) {
      console.error('Erreur lors de la mise à jour des factures:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Group justify="flex-end">
      <Checkbox
        label="Tout facturer"
        disabled={isLoading}
        onChange={(event) => handleCheckAll(event.currentTarget.checked)}
      />
    </Group>
  );
}
