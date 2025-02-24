'use client';

import { useEffect, useState } from 'react';
import { Table, Loader, Text, Stack, Title, Group } from '@mantine/core';
import styles from './textile.module.scss';
import { variantsService, type Variant } from '@/firebase/services/variants';
import { VariantCheckbox } from '@/components/VariantCheckbox';
import { generateVariantId } from '@/utils/variant-helpers';
import { encodeFirestoreId } from '@/utils/firebase-helpers';

interface GroupedVariant {
  sku: string;
  color: string;
  size: string;
  displayName: string;
  variants: Array<{
    variant: Variant;
    encodedOrderId: string;
    variantId: string;
    index: number;
  }>;
  totalQuantity: number;
}

export default function TextilePage() {
  const [variantsBySku, setVariantsBySku] = useState<Map<string, GroupedVariant[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadVariants();
  }, []);

  const loadVariants = async () => {
    try {
      const data = await variantsService.getAllUniqueVariants();
      
      // Grouper les variantes par SKU
      const groupedVariants = new Map<string, GroupedVariant[]>();
      
      data.forEach((variant) => {
        const sku = variant.sku || 'Sans SKU';
        if (!groupedVariants.has(sku)) {
          groupedVariants.set(sku, []);
        }
        
        // Extraire la couleur et la taille
        const [color, size] = variant.variantTitle?.split(' / ') || ['', ''];
        
        // Générer l'ID encodé et le variantId
        const encodedOrderId = encodeFirestoreId(variant.orderId);
        const variantId = generateVariantId(
          encodedOrderId,
          variant.sku,
          color,
          size,
          0,  // index 0 car une seule variante
          variant.productIndex  // utiliser comme lineItemIndex
        );
        
        // Chercher un groupe existant avec le même SKU, couleur et taille
        const variants = groupedVariants.get(sku)!;
        const existingGroup = variants.find(g => 
          g.sku === variant.sku && 
          g.color === color && 
          g.size === size
        );
        
        if (existingGroup) {
          // Ajouter la variante au groupe existant
          existingGroup.variants.push({ 
            variant, 
            encodedOrderId, 
            variantId,
            index: 0  // index 0 car une seule variante
          });
          existingGroup.totalQuantity += variant.totalQuantity;
        } else {
          // Créer un nouveau groupe
          const displayName = `${variant.sku} ${variant.variantTitle || ''}`.trim();
            
          variants.push({
            sku: variant.sku,
            color,
            size,
            displayName,
            variants: [{ 
              variant, 
              encodedOrderId, 
              variantId,
              index: 0  // index 0 car une seule variante
            }],
            totalQuantity: variant.totalQuantity
          });
        }
      });
      
      setVariantsBySku(groupedVariants);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const renderVariantsTable = (groupedVariants: GroupedVariant[]) => (
    <Table>
      <Table.Thead>
        <Table.Tr>
          <Table.Th style={{ width: 200 }}>Commandé</Table.Th>
          <Table.Th style={{ width: '100%' }}>Nom</Table.Th>
          <Table.Th style={{ width: 150 }}>Commandes</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {groupedVariants.map((group) => (
          <Table.Tr key={`${group.sku}-${group.color}-${group.size}`}>
            <Table.Td>
              <Group gap="xs">
                {group.variants.map(({ variant, encodedOrderId, index }) => {
                  const variantId = generateVariantId(
                    encodedOrderId,
                    variant.sku,
                    group.color,
                    group.size,
                    index,
                    variant.productIndex
                  );
                  return (
                    <VariantCheckbox
                      key={variantId}
                      sku={variant.sku}
                      color={group.color}
                      size={group.size}
                      quantity={1}
                      orderId={encodedOrderId}
                      productIndex={variant.productIndex}
                      variantId={variantId}
                    />
                  );
                })}
              </Group>
            </Table.Td>
            <Table.Td>{group.totalQuantity} × {group.displayName}</Table.Td>
            <Table.Td>
              <Group gap="xs">
                {group.variants.map(({ variant }) => (
                  <Text 
                    key={`${variant.orderId}-${variant.productIndex}`}
                  >
                    #{variant.orderNumber}
                  </Text>
                ))}
              </Group>
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );

  if (loading) {
    return (
      <div className={styles.container}>
        <Loader size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <Text c="red">{error}</Text>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1>Articles Textile</h1>
      <Stack gap="xl">
        {Array.from(variantsBySku.entries()).map(([sku, variants]) => (
          <div key={sku}>
            <Title order={2} mb="md">{sku}</Title>
            {renderVariantsTable(variants)}
          </div>
        ))}
      </Stack>
    </div>
  );
}
