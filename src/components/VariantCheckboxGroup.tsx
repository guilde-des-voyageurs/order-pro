'use client';

import { Group, Text } from '@mantine/core';
import { VariantCheckbox } from './VariantCheckbox';
import { useCheckedVariants } from '@/hooks/useCheckedVariants';
import { generateVariantId, calculateGlobalVariantIndex } from '@/utils/variant-helpers';
import { encodeFirestoreId } from '@/utils/firebase-helpers';
import styles from './VariantCheckboxGroup.module.scss';

interface VariantCheckboxGroupProps {
  sku: string;
  color: string;
  size: string;
  quantity: number;
  orderId: string;
  productIndex: number;
  disabled?: boolean;
  lineItems?: Array<{
    sku: string;
    variantTitle?: string;
    quantity: number;
  }>;
}

export const VariantCheckboxGroup = ({
  orderId,
  sku,
  color,
  size,
  quantity,
  productIndex,
  disabled,
  lineItems = []
}: VariantCheckboxGroupProps) => {
  // Calculer le nombre de variants cochés
  const globalIndex = calculateGlobalVariantIndex(
    lineItems.map(item => ({
      sku: item.sku || '',
      selectedOptions: [
        { name: 'couleur', value: item.variantTitle?.split(' / ')[0] || '' },
        { name: 'taille', value: item.variantTitle?.split(' / ')[1] || '' }
      ],
      quantity: item.quantity
    })),
    {
      sku,
      selectedOptions: [
        { name: 'couleur', value: color },
        { name: 'taille', value: size }
      ]
    },
    productIndex
  );

  const checkedCount = useCheckedVariants({
    orderId,
    sku,
    color,
    size,
    index: globalIndex,
    lineItemIndex: productIndex
  });

  return (
    <Group gap={4} wrap="nowrap" className={styles.container}>
      <Group gap={4} wrap="nowrap">
        {Array.from({ length: quantity }).map((_, quantityIndex) => (
          <VariantCheckbox
            key={`${orderId}-${productIndex}-${quantityIndex}`}
            orderId={orderId}
            sku={sku}
            color={color}
            size={size}
            quantity={1}
            productIndex={productIndex}
            quantityIndex={quantityIndex}
            disabled={disabled}
            variantId={generateVariantId(
              encodeFirestoreId(orderId),
              sku,
              color,
              size,
              productIndex,
              quantityIndex
            )}
          />
        ))}
      </Group>
      <Text size="xs" c="dimmed" fw={500}>
        {checkedCount}/{quantity}
      </Text>
    </Group>
  );
};
