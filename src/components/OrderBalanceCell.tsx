import { NumberInput } from '@mantine/core';
import { doc, getFirestore, setDoc } from 'firebase/firestore';
import { encodeFirestoreId } from '@/utils/firebase-helpers';
import { useEffect, useState } from 'react';
import { useDocumentData } from 'react-firebase-hooks/firestore';

interface OrderBalanceCellProps {
  orderId: string;
}

export function OrderBalanceCell({ orderId }: OrderBalanceCellProps) {
  const db = getFirestore();
  const balanceRef = doc(db, 'orders-balance', encodeFirestoreId(orderId));
  const [balance, loading] = useDocumentData(balanceRef);
  const [value, setValue] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (!loading && balance) {
      setValue(balance.amount);
    }
  }, [balance, loading]);

  const handleChange = (value: string | number) => {
    const numericValue = typeof value === 'string' ? parseFloat(value) : value;
    setValue(numericValue);
    setDoc(balanceRef, { amount: numericValue || 0 }, { merge: true });
  };

  return (
    <NumberInput
      placeholder="0"
      value={value}
      onChange={handleChange}
      decimalScale={2}
      fixedDecimalScale
      allowNegative
      styles={{
        wrapper: { minWidth: 100 },
        input: { textAlign: 'right' }
      }}
    />
  );
}
