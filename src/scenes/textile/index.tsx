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
import styles from './textile.module.scss';
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
        const [color, size] = variant.variantTitle?.split(' / ') || ['', ''];
        
        // Générer l'ID encodé et le variantId
        const encodedOrderId = encodeFirestoreId(variant.orderId);
        const variantId = generateVariantId(
          encodedOrderId,
          variant.sku,
          color,
          size,
          variant.productIndex,  // Utiliser l'index du produit dans la commande d'origine
          variant.productIndex
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
            index: variant.productIndex  // Utiliser l'index du produit dans la commande d'origine
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
              index: variant.productIndex  // Utiliser l'index du produit dans la commande d'origine
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

  const handleOrderClick = async (orderId: string) => {
    try {
      console.log('Clicking order:', orderId);
      const sanitizedId = orderId.replace('gid://shopify/Order/', '');
      console.log('Sanitized ID:', sanitizedId);
      const orderRef = doc(db, 'orders', sanitizedId);
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

  const renderVariantsTable = (variants: GroupedVariant[]) => (
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
                  {group.variants.map(({ variant, encodedOrderId, index }) => {
                    // Créer un tableau de la taille de la quantité de la variante
                    return Array.from({ length: variant.totalQuantity }, (_, quantityIndex) => {
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
                          key={`${variantId}-${quantityIndex}`}
                          sku={variant.sku}
                          color={group.color}
                          size={group.size}
                          quantity={1}
                          orderId={encodedOrderId}
                          productIndex={variant.productIndex}
                          variantId={variantId}
                        />
                      );
                    });
                  })}
                </Group>
              </Table.Td>
              <Table.Td>{group.totalQuantity} × {group.displayName}</Table.Td>
              <Table.Td>
                <Group gap="xs">
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
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Paper>
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
    <div className={styles.pageContainer}>
      <Stack gap="md">
        <Title order={2} className={styles.sectionTitle}>
          Textile
        </Title>
        
        {Array.from(variantsBySku.entries()).map(([sku, variants]) => (
          <Stack key={sku} className={styles.section}>
            <Title order={3} className={styles.skuTitle}>
              {sku}
            </Title>
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
