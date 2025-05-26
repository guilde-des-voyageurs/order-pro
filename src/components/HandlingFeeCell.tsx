import { Text } from '@mantine/core';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/db';
import { generateVariantId } from '@/utils/variant-helpers';
import { HANDLING_FEE } from '@/config/billing';
import { useEffect, useState } from 'react';

interface HandlingFeeCellProps {
  orderId: string;
  lineItems: Array<{
    sku?: string;
    variantTitle?: string;
    quantity: number;
    variant?: {
      metafields?: Array<{
        namespace: string;
        key: string;
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

        for (let index = 0; index < validLineItems.length; index++) {
          const item = validLineItems[index];
          const [color, size] = (item.variantTitle || '').split(' / ');

          // Générer les IDs pour toutes les variantes de cette ligne
          const variantIds = Array.from({ length: item.quantity }).map((_, quantityIndex) => {
            return generateVariantId(
              orderId,
              item.sku || '',
              color || '',
              size || '',
              index,
              quantityIndex
            );
          });

          // Vérifier s'il y a des variantes cochées
          const checkedVariantsQuery = query(
            collection(db, 'variants-ordered-v2'),
            where('__name__', 'in', variantIds)
          );
          const checkedVariantsSnapshot = await getDocs(checkedVariantsQuery);
          if (checkedVariantsSnapshot.docs.some(doc => doc.data().checked)) {
            setHasCheckedVariants(true);
            return; // On sort dès qu'on trouve une variante cochée
          }
        }
        setHasCheckedVariants(false);
      } catch (error) {
        console.error('Error checking variants:', error);
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
