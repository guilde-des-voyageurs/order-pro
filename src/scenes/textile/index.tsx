'use client';

import { useEffect, useState } from 'react';
import { Table, Loader, Text } from '@mantine/core';
import styles from './textile.module.scss';
import { variantsService, type Variant } from '@/firebase/services/variants';
import { VariantCheckbox } from '@/components/VariantCheckbox';
import { generateVariantId } from '@/utils/variant-helpers';
import { encodeFirestoreId } from '@/utils/firebase-helpers';

export default function TextilePage() {
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadVariants();
  }, []);

  const loadVariants = async () => {
    try {
      const data = await variantsService.getAllUniqueVariants();
      setVariants(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

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
      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th style={{ width: 40 }}>Commandé</Table.Th>
            <Table.Th>Nom</Table.Th>
            <Table.Th>Variante</Table.Th>
            <Table.Th>SKU</Table.Th>
            <Table.Th>Vendeur</Table.Th>
            <Table.Th>Commandes</Table.Th>
            <Table.Th>Quantité totale</Table.Th>
            <Table.Th>Coût unitaire</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {variants.map((variant) => {
            // Extraire la couleur et la taille de variantTitle (format: "Couleur / Taille")
            const [color, size] = variant.variantTitle?.split(' / ') || [null, null];
            
            // Utiliser l'ID de commande et l'index d'origine
            const encodedOrderId = encodeFirestoreId(variant.orderId);
            const variantId = generateVariantId(
              encodedOrderId,
              variant.sku,
              color,
              size,
              0,
              variant.productIndex // Utiliser l'index original du produit dans la commande
            );

            return (
              <Table.Tr key={variantId}>
                <Table.Td>
                  <VariantCheckbox
                    sku={variant.sku}
                    color={color || ''}
                    size={size || ''}
                    quantity={1}
                    orderId={encodedOrderId}
                    productIndex={variant.productIndex}
                    variantId={variantId}
                  />
                </Table.Td>
                <Table.Td>{variant.title}</Table.Td>
                <Table.Td>{variant.variantTitle}</Table.Td>
                <Table.Td>{variant.sku}</Table.Td>
                <Table.Td>{variant.vendor}</Table.Td>
                <Table.Td>{variant.totalOrders}</Table.Td>
                <Table.Td>{variant.totalQuantity}</Table.Td>
                <Table.Td>
                  {variant.unitCost 
                    ? `${variant.unitCost.toFixed(2)} €` 
                    : '-'}
                </Table.Td>
              </Table.Tr>
            );
          })}
        </Table.Tbody>
      </Table>
    </div>
  );
}
