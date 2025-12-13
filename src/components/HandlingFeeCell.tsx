import { Text } from '@mantine/core';
import { collection, query, where, getDocs, onSnapshot, QuerySnapshot, DocumentData } from 'firebase/firestore';
import { db } from '@/firebase/db';
import { generateVariantId, getColorFromVariant, getSizeFromVariant, getSelectedOptions } from '@/utils/variant-helpers';
import { HANDLING_FEE } from '@/config/billing';
import { useEffect, useState } from 'react';

interface HandlingFeeCellProps {
  orderId: string;
  lineItems: Array<{
    sku?: string;
    variantTitle?: string;
    quantity: number;
    variant?: {
      id?: string;
      metafields?: Array<{
        namespace: string;
        key: string;
        value: string;
      }>;
      selectedOptions?: Array<{
        name: string;
        value: string;
      }>;
    };
  }>;
}

export function HandlingFeeCell({ orderId, lineItems }: HandlingFeeCellProps) {
  const [hasCheckedVariants, setHasCheckedVariants] = useState(false);

  useEffect(() => {
    const checkVariants = async () => {
      try {
        // Filtrer les lineItems qui ont un SKU
        const validLineItems = lineItems.filter(item => item.sku);
        const allVariantIds: string[] = [];

        // Générer tous les IDs de variantes
        for (let index = 0; index < validLineItems.length; index++) {
          const item = validLineItems[index];
          const color = getColorFromVariant(item);
          const size = getSizeFromVariant(item);
          const selectedOptions = getSelectedOptions(item);

          for (let quantityIndex = 0; quantityIndex < item.quantity; quantityIndex++) {
            const variantId = generateVariantId(
              orderId,
              item.sku || '',
              color,
              size,
              index,
              quantityIndex,
              selectedOptions
            );
            allVariantIds.push(variantId);
          }
        }

        // Écouter les changements en temps réel
        const unsubscribe = onSnapshot(
          query(
            collection(db, 'variants-ordered-v2'),
            where('__name__', 'in', allVariantIds)
          ),
          (snapshot: QuerySnapshot<DocumentData>) => {
            const hasChecked = snapshot.docs.some(doc => doc.data().checked);
            setHasCheckedVariants(hasChecked);
          },
          (error: Error) => {
            console.error('Error listening to variants:', error);
            setHasCheckedVariants(false);
          }
        );

        return () => unsubscribe();
      } catch (error) {
        console.error('Error setting up variants listener:', error);
        setHasCheckedVariants(false);
      }
    };

    checkVariants();
  }, [orderId, lineItems]);

  if (!hasCheckedVariants) {
    return <Text size="sm" c="dimmed">-</Text>;
  }

  return (
    <Text size="sm" fw={500}>
      {HANDLING_FEE.toFixed(2)}€ HT
    </Text>
  );
}
