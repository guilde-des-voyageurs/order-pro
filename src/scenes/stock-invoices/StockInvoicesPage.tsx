'use client';

// External dependencies
import { Title, Text, Loader, Table, Group, Stack, Paper, Badge, Select, Button, Divider } from '@mantine/core';
import { IconMessage, IconAlertTriangle, IconCalculator } from '@tabler/icons-react';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/db';
import { useState, useEffect, useRef } from 'react';

// Internal dependencies
import { useStockInvoicesPresenter } from './StockInvoicesPage.presenter';
import { OrderDrawer } from '@/components/OrderDrawer/OrderDrawer';
import { useInvoiceStatus } from '@/components/InvoiceCheckbox/InvoiceCheckbox';
import { TextileProgress } from '@/components/TextileProgress/TextileProgress';
import { DaysElapsed } from '@/components/DaysElapsed/DaysElapsed';
import { VariantCheckbox } from '@/components/VariantCheckbox';
import { BillingNoteInput } from '@/components/BillingNoteInput/BillingNoteInput';
import { BatchBalance } from '@/components/BatchBalance';
import { OrderItemsList } from '@/components/OrderItemsList/OrderItemsList';

// Hooks
import { calculateItemPrice, PriceRule, usePriceRules } from '@/hooks/usePriceRules';
import { useCheckedVariants } from '@/hooks/useCheckedVariants';

// Utils
import { encodeFirestoreId } from '@/utils/firebase-helpers';
import { generateVariantId, getSelectedOptions, getColorFromVariant, getSizeFromVariant } from '@/utils/variant-helpers';
import { transformColor } from '@/utils/color-transformer';

// Types
import type { ShopifyOrder } from '@/types/shopify';

interface LineItemRowProps {
  item: NonNullable<ShopifyOrder['lineItems']>[number];
  index: number;
  orderId: string;
  rules: PriceRule[];
}

// Styles
import styles from './StockInvoicesPage.module.scss';

interface OrderOptionType {
  value: string;
  label: string;
  order: ShopifyOrder;
}

// Helpers
function formatItemString(item: NonNullable<ShopifyOrder['lineItems']>[number]) {
  // SKU et couleur (utiliser les helpers pour extraction correcte)
  const sku = item.sku || '';
  const color = getColorFromVariant(item);
  
  // Fichiers d'impression
  const printFile = item.variant?.metafields?.find(
    m => m.namespace === 'custom' && m.key === 'fichier_d_impression'
  )?.value || '';
  const versoFile = item.variant?.metafields?.find(
    m => m.namespace === 'custom' && m.key === 'verso_impression'
  )?.value || '';

  // Construire la chaîne pour le calcul du prix
  const parts = [
    `${sku} - ${color || ''}`,
    printFile,
    versoFile
  ].filter(Boolean);

  return parts.join(' - ');
}

function LineItemRow({ item, index, orderId, rules, onPriceCalculated }: LineItemRowProps & { onPriceCalculated: (price: number) => void }) {
  // Extraire les options de variantes
  const selectedOptions = getSelectedOptions(item);
  const color = getColorFromVariant(item);
  const size = getSizeFromVariant(item);
  
  const checkedCount = useCheckedVariants({
    orderId: orderId,
    sku: item.sku || '',
    color: color,
    size: size,
    productIndex: index,
    quantity: item.quantity,
    lineItems: [{
      sku: item.sku || undefined,
      variantTitle: item.variantTitle || undefined,
      quantity: item.quantity
    }]
  });

  const price = calculateItemPrice(formatItemString(item), rules);
  const total = checkedCount > 0 ? `${price.toFixed(2)}€ HT × ${checkedCount} = ${(price * checkedCount).toFixed(2)}€ HT` : '-';

  // Notifier le parent du prix calculé quand le nombre d'éléments cochés change
  useEffect(() => {
    onPriceCalculated(price * checkedCount);
  }, [checkedCount, price, onPriceCalculated]);
  
  // Séparer l'affichage du calcul
  const displayString = `${item.sku || ''} - ${color} - ${size}`;

  return (
    <Table.Tr style={{ opacity: item.isCancelled ? 0.5 : 1 }}>
      <Table.Td>
        <Group gap="xs">
          {Array.from({ length: item.quantity }).map((_, quantityIndex) => (
            <VariantCheckbox
              key={quantityIndex}
              orderId={orderId}
              sku={item.sku || ''}
              color={color}
              size={size}
              quantity={1}
              productIndex={index}
              quantityIndex={quantityIndex}
              variantId={generateVariantId(
                encodeFirestoreId(orderId),
                item.sku || '',
                color,
                size,
                index,
                quantityIndex,
                selectedOptions
              )}
              disabled={item.isCancelled === true}
            />
          ))}
        </Group>
      </Table.Td>
      <Table.Td>
        <Group gap="xs">
          <Text c={item.isCancelled ? "dimmed" : undefined}>{displayString}</Text>
          {item.isCancelled && (
            <Badge color="red" variant="light">Annulé</Badge>
          )}
        </Group>
      </Table.Td>
      <Table.Td>{item.quantity}</Table.Td>
      <Table.Td>
        <Stack gap={2}>
          {(() => {
            const appliedRules: PriceRule[] = [];
            const itemString = formatItemString(item);

            // Trouver les règles appliquées
            rules.forEach(rule => {
              if (rule.searchString && itemString.toLowerCase().includes(rule.searchString.toLowerCase())) {
                appliedRules.push(rule);
              }
            });

            return (
              <>
                <Text size="sm">{itemString}</Text>
                {appliedRules.map((rule, i) => (
                  <Text size="xs" c="dimmed" key={i}>
                    + {rule.price.toFixed(2)}€ HT ({rule.searchString})
                  </Text>
                ))}
                <Text fw={500}>
                  = {price.toFixed(2)}€ HT
                </Text>
              </>
            );
          })()}
        </Stack>
      </Table.Td>
      <Table.Td>{total}</Table.Td>
    </Table.Tr>
  );
}

export function StockInvoicesPage() {
  const { 
    isLoading,
    pendingOrders: orders,
    selectedOrder,
    onSelectOrder,
    onCloseDrawer,
    isDrawerOpen,
    orderStats
  } = useStockInvoicesPresenter();

  const { rules } = usePriceRules();
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const currentOrder = orders.find(o => o.id === selectedOrderId);
  const activeItems = currentOrder?.lineItems?.filter(item => !item.isCancelled) || [];
  const itemPrices = useRef<Map<number, number>>(new Map());



  // Réinitialiser itemPrices quand on change de commande
  useEffect(() => {
    itemPrices.current.clear();
  }, [selectedOrderId]);

  // Écouter les changements de total
  useEffect(() => {
    if (!currentOrder) return;

    const encodedId = encodeFirestoreId(currentOrder.id);
    const unsubscribe = onSnapshot(doc(db, 'BillingNotesBatch', encodedId), (doc) => {
      if (doc.exists()) {
        setTotalAmount(doc.data().total || 0);
      }
    });

    return () => unsubscribe();
  }, [currentOrder]);

  const calculateTotal = async () => {
    if (!currentOrder) return;

    // Ne calculer que pour la commande courante
    const itemsTotal = currentOrder.lineItems
      ?.map((_, index) => itemPrices.current.get(index) || 0)
      .reduce((sum, p) => sum + p, 0) || 0;
    const encodedId = encodeFirestoreId(currentOrder.id);
    const balanceDoc = await getDoc(doc(db, 'BillingNotesBatch', encodedId));
    const balance = balanceDoc.exists() ? (balanceDoc.data().balance || 0) : 0;
    const newTotal = itemsTotal + balance;

    // Mettre à jour le total dans Firebase
    await setDoc(doc(db, 'BillingNotesBatch', encodedId), {
      total: newTotal,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    setTotalAmount(newTotal);
  };

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <Loader />
      </div>
    );
  }

  const orderOptions: OrderOptionType[] = orders.map(order => ({
    value: order.id,
    label: order.name,
    order: order
  }));

  return (
    <div className={styles.container}>
      <Stack gap="xl">
        <div className={styles.header}>
          <Title order={2}>Facturation Stock</Title>
        </div>

        <Paper p="md" withBorder>
          <Stack gap="md">
            <Select
              label="Sélectionner une commande batch"
              placeholder="Choisir une commande..."
              data={orderOptions}
              value={selectedOrderId}
              onChange={setSelectedOrderId}
              searchable
              clearable
              renderOption={(props) => {
                const option = props.option as OrderOptionType;
                const { isInvoiced } = useInvoiceStatus(option.order.id);
                return (
                  <Group justify="space-between" wrap="nowrap">
                    <Group wrap="nowrap">
                      <div>
                        <Text size="sm" fw={500}>{option.order.name}</Text>
                        <Group gap="xs">
                          {option.order.tags?.map((tag) => (
                            <Badge key={tag} size="xs" variant="light" color="gray">{tag}</Badge>
                          ))}
                        </Group>
                      </div>
                    </Group>
                    <Group gap="sm" wrap="nowrap">
                      {isInvoiced && (
                        <Badge color="green" variant="light">Facturée</Badge>
                      )}
                      <DaysElapsed 
                        createdAt={option.order.createdAt} 
                        isFulfilled={option.order.displayFulfillmentStatus === 'FULFILLED'}
                      />
                      <TextileProgress 
                        orderId={encodeFirestoreId(option.order.id)} 
                      />
                    </Group>
                  </Group>
                );
              }}
            />

            {currentOrder && (
              <Stack gap="md">
                {/* Bloc avec numéro de commande, suivi des articles, balance, etc. (déplacé vers le haut) */}
                <Paper withBorder p="md">
                  <Stack gap="md">
                    <Group justify="space-between" align="center">
                      <Group gap="xs">
                        <Text fw={500} size="lg">{currentOrder?.name}</Text>
                        <TextileProgress orderId={encodeFirestoreId(currentOrder?.id || '')} />
                      </Group>
                      {/* Balance supprimée d'ici car intégrée au Résumé d'atelier */}
                      <BillingNoteInput orderId={currentOrder?.id || ''} />
                    </Group>
                  </Stack>
                </Paper>

                {/* Résumé d'atelier */}
                <Paper withBorder p="md">
                  <Stack gap="md">                    
                    {currentOrder && <OrderItemsList order={currentOrder} />}
                  </Stack>
                </Paper>
                
                {/* Calcul des prix en arrière-plan sans utiliser le composant Table */}
                <div style={{ display: 'none' }}>
                  {currentOrder?.lineItems?.map((item, index) => {
                    // Calculer le prix pour chaque article sans afficher de composant
                    if (!item.isCancelled) {
                      const sku = item.sku || '';
                      // Utiliser les helpers pour extraction correcte avec transformation de couleur
                      const color = getColorFromVariant(item);
                      const size = getSizeFromVariant(item);
                      
                      // Fichiers d'impression
                      const printFile = item.variant?.metafields?.find(
                        m => m.namespace === 'custom' && m.key === 'fichier_d_impression'
                      )?.value || '';
                      const versoFile = item.variant?.metafields?.find(
                        m => m.namespace === 'custom' && m.key === 'verso_impression'
                      )?.value || '';
                      
                      // Construire la chaîne pour le calcul du prix
                      const itemString = [
                        `${sku} - ${color || ''}`,
                        printFile,
                        versoFile
                      ].filter(Boolean).join(' - ');
                      
                      // Calculer le prix et le stocker
                      const price = calculateItemPrice(itemString, rules);
                      itemPrices.current.set(index, price);
                    } else {
                      itemPrices.current.set(index, 0);
                    }
                    return null; // Ne rien rendre dans le DOM
                  })}
                </div>
              </Stack>
            )}
          </Stack>
        </Paper>
      </Stack>

      <OrderDrawer
        order={selectedOrder}
        opened={isDrawerOpen}
        onClose={onCloseDrawer}
      />
    </div>
  );
}
