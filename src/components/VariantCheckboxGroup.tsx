'use client';

import { Group, Text } from '@mantine/core';
import { VariantCheckbox } from './VariantCheckbox';
import { useCheckedVariants } from '@/hooks/useCheckedVariants';
import { generateVariantId, calculateGlobalVariantIndex } from '@/utils/variant-helpers';
import { encodeFirestoreId } from '@/utils/firebase-helpers';
import { useLegacyVariantId } from '@/hooks/useLegacyVariantId';
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
  variantTitle?: string;
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
  variantTitle,
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
      {Array.from({ length: quantity }).map((_, quantityIndex) => {
        // Générer l'ID correct
        const correctId = generateVariantId(
          orderId,
          sku,
          color,
          size,
          productIndex,
          quantityIndex,
          selectedOptions
        );

        return (
          <LegacyAwareCheckbox
            key={`${orderId}-${productIndex}-${quantityIndex}`}
            orderId={orderId}
            sku={sku}
            color={color}
            size={size}
            quantity={1}
            productIndex={productIndex}
            quantityIndex={quantityIndex}
            disabled={disabled}
            variantId={correctId}
            variantTitle={variantTitle}
          />
        );
      })}
    </Group>
  );
};

// Wrapper qui gère la rétrocompatibilité
function LegacyAwareCheckbox(props: {
  orderId: string;
  sku: string;
  color: string;
  size: string;
  quantity: number;
  productIndex: number;
  quantityIndex: number;
  disabled?: boolean;
  variantId: string;
  variantTitle?: string;
}) {
  const finalId = useLegacyVariantId(
    props.orderId,
    props.sku,
    props.color,
    props.size,
    props.productIndex,
    props.quantityIndex,
    props.variantTitle
  );

  return (
    <VariantCheckbox
      orderId={props.orderId}
      sku={props.sku}
      color={props.color}
      size={props.size}
      quantity={props.quantity}
      productIndex={props.productIndex}
      quantityIndex={props.quantityIndex}
      disabled={props.disabled}
      variantId={finalId || props.variantId}
    />
  );
}
