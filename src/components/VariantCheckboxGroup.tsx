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
  selectedOptions?: Array<{name: string, value: string}>;
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
  selectedOptions,
  lineItems = []
}: VariantCheckboxGroupProps) => {
  const checkedCount = useCheckedVariants({
    orderId,
    sku,
    color,
    size,
    productIndex,
    quantity,
    lineItems
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
              orderId,
              sku,
              color,
              size,
              productIndex,
              quantityIndex,
              selectedOptions
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
