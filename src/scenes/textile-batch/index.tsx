'use client';

import { useEffect, useState, useRef } from 'react';
import { 
  Table, 
  Loader, 
  Text, 
  Stack, 
  Title, 
  Group, 
  Paper, 
  Image, 
  Alert, 
  List, 
  Badge, 
  Button 
} from '@mantine/core';
import { IconAlertTriangle, IconMessage } from '@tabler/icons-react';
import styles from './textile-batch.module.scss';
import { variantsService, type Variant } from '@/firebase/services/variants';
import { VariantCheckbox } from '@/components/VariantCheckbox';
import { generateVariantId } from '@/utils/variant-helpers';
import { encodeFirestoreId } from '@/utils/firebase-helpers';
import { db } from '@/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { OrderDrawer } from '@/components/OrderDrawer/OrderDrawer';
import { ShopifyOrder } from '@/types/shopify';

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

export default function TextileBatchPage() {
  const [variantsBySku, setVariantsBySku] = useState<Map<string, GroupedVariant[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<ShopifyOrder | undefined>(undefined);
  const [drawerOpened, setDrawerOpened] = useState(false);

  useEffect(() => {
    loadVariants();
  }, []);

  const loadVariants = async () => {
    try {
      // Utiliser le service pour récupérer les variantes des commandes batch
      const data = await variantsService.getBatchVariants();
      
      // Grouper les variantes par SKU
      const groupedVariants = new Map<string, GroupedVariant[]>();
      
      data.forEach((variant) => {
        const sku = variant.sku || 'Sans SKU';
        if (!groupedVariants.has(sku)) {
          groupedVariants.set(sku, []);
        }
        
        // Extraire la couleur et la taille
        const [color, size] = variant.variantTitle?.split(' / ') || ['', ''];
        
        // Générer l'ID encodé pour la commande
        const encodedOrderId = encodeFirestoreId(variant.orderId);
        
        // Chercher un groupe existant avec le même SKU, couleur et taille
        const variants = groupedVariants.get(sku)!;
        const existingGroup = variants.find(g => 
          g.sku === variant.sku && 
          g.color === color && 
          g.size === size
        );
        
        if (existingGroup) {
          // Créer une entrée par unité de la variante
          for (let i = 0; i < variant.totalQuantity; i++) {
            existingGroup.variants.push({ 
              variant, 
              encodedOrderId,
              index: variant.productIndex,  // Utiliser l'index du produit dans la commande d'origine
              variantId: generateVariantId(
                encodedOrderId,
                variant.sku,
                color,
                size,
                variant.productIndex,
                i // Utiliser i comme index de quantité
              )
            });
          }
          existingGroup.totalQuantity += variant.totalQuantity;
        } else {
          // Créer un nouveau groupe
          const displayName = variant.title.split(' - ')[0];
          variants.push({
            sku: variant.sku,
            color,
            size,
            displayName,
            variants: Array.from({ length: variant.totalQuantity }, (_, i) => ({
              variant,
              encodedOrderId,
              index: variant.productIndex,  // Utiliser l'index du produit dans la commande d'origine
              variantId: generateVariantId(
                encodedOrderId,
                variant.sku,
                color,
                size,
                variant.productIndex,
                i // Utiliser i comme index de quantité
              )
            })),
            totalQuantity: variant.totalQuantity
          });
        }
      });
      
      setVariantsBySku(groupedVariants);
      setLoading(false);
    } catch (err) {
      console.error('Erreur lors du chargement des variantes:', err);
      setError('Une erreur est survenue lors du chargement des variantes.');
      setLoading(false);
    }
  };

  const viewOrder = async (orderId: string) => {
    try {
      const orderRef = doc(db, 'orders-v2', orderId);
      const orderSnap = await getDoc(orderRef);
      
      if (orderSnap.exists()) {
        setSelectedOrder(orderSnap.data() as ShopifyOrder);
        setSelectedOrderId(orderId);
        setDrawerOpened(true);
      }
    } catch (err) {
      console.error('Erreur lors du chargement de la commande:', err);
    }
  };

  if (loading) {
    return (
      <Stack align="center" mt="xl">
        <Loader />
        <Text>Chargement des variantes...</Text>
      </Stack>
    );
  }

  if (error) {
    return (
      <Alert icon={<IconAlertTriangle size={16} />} title="Erreur" color="red">
        {error}
      </Alert>
    );
  }

  // Convertir la Map en tableau et trier par SKU
  const variants = Array.from(variantsBySku.entries())
    .sort(([skuA], [skuB]) => skuA.localeCompare(skuB))
    .flatMap(([_, groups]) => groups);

  if (variants.length === 0) {
    return (
      <Alert icon={<IconMessage size={16} />} title="Aucune variante" color="gray">
        Aucune variante trouvée dans les commandes batch.
      </Alert>
    );
  }

  return (
    <>
      <div className={styles.pageContainer}>
        <Stack gap="lg">
          <Title order={2}>Textile Batch</Title>
        
          {loading && (
            <Group justify="center">
              <Loader />
            </Group>
          )}

          {error && (
            <Alert icon={<IconAlertTriangle size={16} />} title="Erreur" color="red">
              Une erreur est survenue lors du chargement des variantes.
            </Alert>
          )}

          {!loading && !error && variantsBySku.size === 0 && (
            <Alert icon={<IconMessage size={16} />} title="Aucune variante" color="gray">
              Aucune variante n'a été trouvée.
            </Alert>
          )}

          {!loading && !error && variantsBySku.size > 0 && (
            <Stack gap="xl">
              {Array.from(variantsBySku.entries()).map(([sku, variants]) => (
                <Stack key={sku} className={styles.section}>
                  <Title order={3} className={styles.skuTitle}>
                    {sku}
                  </Title>
                  <Paper withBorder className={styles.tableContainer}>
                  <Table>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th style={{ width: 200 }}>Commandé</Table.Th>
                        <Table.Th style={{ width: '100%' }}>Nom</Table.Th>
                        <Table.Th style={{ width: 150 }}>Commandes</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {variants.map((group) => (
                        <Table.Tr 
                          key={`${group.sku}-${group.color}-${group.size}`}
                          className={styles.tableRow}
                        >
                          <Table.Td>
                            <Group gap="xs">
                              {group.variants.map(({ variant, encodedOrderId, index, variantId }) => (
                                <VariantCheckbox
                                  key={`${variantId}`}
                                  sku={variant.sku}
                                  color={group.color}
                                  size={group.size}
                                  quantity={1}
                                  orderId={encodedOrderId}
                                  productIndex={variant.productIndex}
                                  quantityIndex={index}
                                  variantId={variantId}
                                />
                              ))}
                            </Group>
                          </Table.Td>
                          <Table.Td>{group.totalQuantity} × {group.displayName}</Table.Td>
                          <Table.Td>
                            <div className={styles.orderNumbers}>
                              {group.variants.map(({ variant }) => (
                                <Text 
                                  key={variant.orderNumber}
                                  className={styles.orderNumber}
                                  onClick={() => viewOrder(variant.orderId)}
                                >
                                  #{variant.orderNumber}
                                </Text>
                              ))}
                            </div>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                  </Paper>
                </Stack>
              ))}
            </Stack>
          )}
        </Stack>
      </div>

      <OrderDrawer
        opened={drawerOpened}
        onClose={() => {
          setDrawerOpened(false);
          setSelectedOrder(undefined);
          setSelectedOrderId(null);
        }}
        order={selectedOrder}
      />
    </>
  );
}
