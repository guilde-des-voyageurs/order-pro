'use client';

import { Group, Text } from '@mantine/core';
import { VariantCheckbox } from './VariantCheckbox';
import { useCheckedVariants } from '@/hooks/useCheckedVariants';
import { generateVariantId } from '@/utils/variant-helpers';
import styles from './VariantCheckboxGroup.module.scss';

interface VariantCheckboxGroupProps {
  orderId: string;
  sku: string;
  color: string;
  size: string;
  quantity: number;
  productIndex: number;
  disabled?: boolean;
}

export const VariantCheckboxGroup = ({
  orderId,
  sku,
  color,
  size,
  quantity,
  productIndex,
  disabled
}: VariantCheckboxGroupProps) => {
  const checkedCount = useCheckedVariants({ sku, color, size });

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
            disabled={disabled}
            variantId={generateVariantId(
              orderId,
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
