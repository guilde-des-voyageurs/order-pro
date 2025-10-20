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
import { transformColor } from '@/utils/color-transformer';
import styles from './textile.module.scss';
import { variantsService, type Variant } from '@/firebase/services/variants';
import { VariantCheckbox } from '@/components/VariantCheckbox';
import { generateVariantId } from '@/utils/variant-helpers';
import { encodeFirestoreId } from '@/utils/firebase-helpers';
import { db } from '@/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { compareSizes } from '@/utils/size-helpers';
import { OrderDrawer } from '@/components/OrderDrawer/OrderDrawer';
import { ShopifyOrder } from '@/types/shopify';
import { SkuGroupActions } from '@/components/SkuGroupCheckbox';

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
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<ShopifyOrder | null>(null);
  
  const [drawerOpened, setDrawerOpened] = useState(false);

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
        const parts = variant.variantTitle?.split(' / ') || ['', ''];
        // Pour les variantes à 3+ niveaux : dernier = taille, avant-dernier = couleur
        const size = parts.length > 0 ? parts[parts.length - 1] : '';
        const rawColor = parts.length > 1 ? parts[parts.length - 2] : parts[0] || '';
        // Appliquer transformColor pour avoir des noms cohérents (Mocha → Chocolat, etc.)
        const color = transformColor(rawColor || '');
        
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
          // Ajouter la variante au groupe existant
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
          // Transformer les couleurs dans le variantTitle pour l'affichage
          const transformedVariantTitle = variant.variantTitle
            ?.split(' / ')
            .map((part, index) => index === 0 ? transformColor(part) : part)
            .join(' - ') || '';
          const displayName = `${variant.sku} ${transformedVariantTitle}`.trim();
            
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handleOrderClick = async (orderId: string) => {
    try {
      console.log('Clicking order:', orderId);
      const sanitizedId = orderId.replace('gid://shopify/Order/', '');
      console.log('Sanitized ID:', sanitizedId);
      const orderRef = doc(db, 'orders-v2', sanitizedId);
      const orderDoc = await getDoc(orderRef);
      console.log('Order doc:', orderDoc.exists() ? 'exists' : 'does not exist');
      if (orderDoc.exists()) {
        const orderData = orderDoc.data() as ShopifyOrder;
        console.log('Order data:', orderData);
        setSelectedOrder(orderData);
        setSelectedOrderId(orderId);
        setDrawerOpened(true);
      }
    } catch (error) {
      console.error('Error fetching order:', error);
    }
  };

  const handleDrawerClose = () => {
    setDrawerOpened(false);
    setSelectedOrderId(null);
    setSelectedOrder(null);
  };

  const renderVariantsTable = (variants: GroupedVariant[]) => {
    // Trier les variantes par couleur puis par taille
    const sortedVariants = [...variants].sort((a, b) => {
      // D'abord par couleur
      const colorCompare = a.color.localeCompare(b.color);
      if (colorCompare !== 0) return colorCompare;
      
      // Ensuite par taille selon l'ordre défini
      return compareSizes(a.size, b.size);
    });

    return (
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
          {sortedVariants.map((group) => (
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
              <Table.Td>{group.totalQuantity} × {group.sku} - {group.color} - {group.size}</Table.Td>
              <Table.Td>
                <div className={styles.orderNumbers}>
                  {group.variants.map(({ variant }) => (
                    <Text 
                      key={`${variant.orderId}-${variant.productIndex}`}
                      className={styles.orderNumber}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOrderClick(variant.orderId);
                      }}
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
  )};

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
    <div className={styles.pageContainer}>
      <Stack gap="md">
        <Title order={2} className={styles.sectionTitle}>
          Textile
        </Title>
        
        {Array.from(variantsBySku.entries())
          .sort(([skuA], [skuB]) => skuA.localeCompare(skuB))
          .map(([sku, variants]) => (
          <Stack key={sku} className={styles.section}>
            <Group align="center" justify="space-between">
              <Title order={3} className={styles.skuTitle}>
                {sku}
              </Title>
              <SkuGroupActions
                sku={sku}
                variants={variants.flatMap(group => group.variants.map(v => ({
                  ...v,
                  color: group.color,
                  size: group.size
                })))}
              />
            </Group>
            {renderVariantsTable(variants)}
          </Stack>
        ))}
      </Stack>

      <OrderDrawer
        order={selectedOrder ?? undefined}
        opened={drawerOpened}
        onClose={handleDrawerClose}
      />
    </div>
  );
}
