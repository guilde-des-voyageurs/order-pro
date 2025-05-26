import { Checkbox } from '@mantine/core';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '@/firebase/db';
import { useEffect, useState } from 'react';

interface InvoiceStatusCheckboxProps {
  orderId: string;
}

export function InvoiceStatusCheckbox({ orderId }: InvoiceStatusCheckboxProps) {
  const [isInvoiced, setIsInvoiced] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, 'InvoiceStatus', orderId),
      (doc) => {
        if (doc.exists()) {
          setIsInvoiced(doc.data().invoiced || false);
        } else {
          setIsInvoiced(false);
        }
      },
      (error) => {
        console.error('Error fetching invoice status:', error);
        setIsInvoiced(false);
      }
    );

    return () => unsubscribe();
  }, [orderId]);

  const handleChange = async (checked: boolean) => {
    try {
      await setDoc(doc(db, 'InvoiceStatus', orderId), {
        invoiced: checked,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error updating invoice status:', error);
    }
  };

  return (
    <Checkbox 
      checked={isInvoiced}
      onChange={(event) => handleChange(event.currentTarget.checked)}
      aria-label="Statut de facturation"
    />
  );
}
