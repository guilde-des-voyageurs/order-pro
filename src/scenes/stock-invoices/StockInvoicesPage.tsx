'use client';

// External dependencies
import { Title, Text, Loader, Table, Button, Group, Stack, Paper, Badge, Checkbox, Alert, ActionIcon, Tooltip, Box } from '@mantine/core';
import { clsx } from 'clsx';
import { IconMessage, IconAlertTriangle, IconArrowsSort } from '@tabler/icons-react';
import { useState } from 'react';

// Internal dependencies
import { useStockInvoicesPresenter } from './StockInvoicesPage.presenter';
import { OrderDrawer } from '@/components/OrderDrawer/OrderDrawer';
import { InvoiceCheckbox, useInvoiceStatus } from '@/components/InvoiceCheckbox/InvoiceCheckbox';
import { TextileProgress } from '@/components/TextileProgress/TextileProgress';
import { DaysElapsed } from '@/components/DaysElapsed/DaysElapsed';

import { VariantCheckbox } from '@/components/VariantCheckbox';
import { BillingNoteInput } from '@/components/BillingNoteInput/BillingNoteInput';

// Hooks
import { useCheckedVariants } from '@/hooks/useCheckedVariants';
import { usePriceRules, calculateItemPrice } from '@/hooks/usePriceRules';
import { useBillingNotes } from '@/hooks/useBillingNotes';

// Utils
import { encodeFirestoreId } from '@/utils/firebase-helpers';
import { transformColor, colorMappings } from '@/utils/color-transformer';
import { generateVariantId, getDefaultSku, calculateGlobalVariantIndex } from '@/utils/variant-helpers';

// Types
import type { ShopifyOrder } from '@/types/shopify';

// Styles
import styles from './StockInvoicesPage.module.scss';

function formatItemString(item: NonNullable<ShopifyOrder['lineItems']>[0]) {
  // SKU
  const sku = item.sku || '';

  // Transformer la couleur et la taille
  const [color, size] = (item.variantTitle || '').split(' / ');
  const cleanedColor = color?.replace(/\s*\([^)]*\)\s*/g, '').trim() || '';
  const normalizedColor = cleanedColor.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  const foundColor = Object.entries(colorMappings).find(([key]) => 
    key.normalize('NFD').replace(/[\u0300-\u036f]/g, '') === normalizedColor
  );
  const transformedColor = foundColor ? foundColor[1].internalName : cleanedColor;

  // Fichier d'impression
  const printFile = item.variant?.metafields?.find(
    m => m.namespace === 'custom' && m.key === 'fichier_d_impression'
  )?.value || '';

  // Verso impression
  const versoFile = item.variant?.metafields?.find(
    m => m.namespace === 'custom' && m.key === 'verso_impression'
  )?.value || '';

  // Construire la chaîne finale
  const parts = [sku, transformedColor, size, printFile, versoFile].filter(Boolean);
  return parts.join(' - ');
}


interface OrderRowProps {
  order: ShopifyOrder;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

function OrderRow({ order, isSelected, onSelect }: OrderRowProps) {
  const { rules } = usePriceRules();
  const { isInvoiced } = useInvoiceStatus(order.id);
  
  return (
    <Paper className={clsx(styles.orderRow, { [styles.invoiced]: isInvoiced })} withBorder>
      <Stack gap="md">
        <div className={styles.orderInfo}>
          <div className={styles.orderHeader}>
            <div className={styles.orderTitle}>
              <Text fw={500}>{order.name}</Text>
              <Group gap="xs">
                {order.tags.map((tag) => (
                  <Badge key={tag} size="sm" variant="light" color="gray">{tag}</Badge>
                ))}
              </Group>
              {order.tags.some(tag => tag.toLowerCase().includes('batch')) && (
                <Box mt="xs">
                  <BillingNoteInput orderId={order.id} />
                </Box>
              )}
            </div>
            <div className={styles.orderWaiting}>
              <DaysElapsed 
                createdAt={order.createdAt} 
                isFulfilled={order.displayFulfillmentStatus === 'FULFILLED'} 
              />
              <TextileProgress orderId={encodeFirestoreId(order.id)} />
            </div>
          </div>

          <div className={styles.orderDetails}>
            <Group gap="lg" align="center">
              <InvoiceCheckbox 
                orderId={encodeFirestoreId(order.id)} 
                readOnly={order.displayFinancialStatus?.toLowerCase() === 'cancelled'} 
              />
              {(() => {
                const { deliveryCost } = useBillingNotes(order.id);
                const itemsTotal = order.lineItems?.reduce((acc, item, itemIndex) => {
                  if (item.isCancelled) return acc;
                  const price = calculateItemPrice(formatItemString(item), rules);
                  const checkedCount = useCheckedVariants({
                    orderId: encodeFirestoreId(order.id),
                    sku: item.sku || '',
                    color: transformColor(item.variantTitle?.split(' / ')[0] || ''),
                    size: item.variantTitle?.split(' / ')[1] || '',
                    index: itemIndex,
                    lineItemIndex: undefined,
                    quantity: item.quantity
                  });
                  return acc + (price * checkedCount);
                }, 0);
                const total = Number(itemsTotal) + Number(deliveryCost || 0);
                if (!total || total <= 0) return null;
                return (
                  <Text fw={500} size="lg">
                    Total HT : {total.toFixed(2)}€ {deliveryCost ? `(dont ${deliveryCost}€ de frais de port)` : ''}
                  </Text>
                );
              })()} 
            </Group>
          </div>
        </div>

        <div className={styles.orderItems}>
          <div className={styles.productList}>
            {order.lineItems?.map((item, itemIndex) => (
                <Paper 
                  key={item.id} 
                  className={clsx(styles.productItem, { [styles.cancelled]: item.isCancelled })}
                  withBorder
                  p="md"
                >
                  <div className={styles.productContent}>
                    <div className={styles.productInfo}>
                      <Text fw={500}>{item.title}</Text>
                      <Group gap="xs" className={styles.productMetadata}>
                        {item.sku && (
                          <Text size="sm" c="dimmed">{item.sku}</Text>
                        )}
                        {item.variantTitle && (
                          <Text size="sm" c="dimmed">
                            {item.variantTitle.split(' / ').map((variant) => {
                              const cleanedVariant = variant.replace(/\s*\([^)]*\)\s*/g, '').trim();
                              const normalizedColor = cleanedVariant.toLowerCase()
                                .normalize('NFD')
                                .replace(/[\u0300-\u036f]/g, '');
                              const foundColor = Object.entries(colorMappings).find(([key]) => 
                                key.normalize('NFD').replace(/[\u0300-\u036f]/g, '') === normalizedColor
                              );
                              return foundColor ? foundColor[1].internalName : variant;
                            }).join(' / ')}
                          </Text>
                        )}
                        {item.variant?.metafields?.find(m => m.namespace === 'custom' && m.key === 'fichier_d_impression') && (
                          <Badge
                            variant="light"
                            color="gray"
                            radius="xl"
                            size="lg"
                            styles={{
                              root: {
                                fontWeight: 400,
                                color: 'var(--mantine-color-dark-6)'
                              }
                            }}
                          >
                            {item.variant?.metafields?.find(m => m.namespace === 'custom' && m.key === 'fichier_d_impression')?.value}
                          </Badge>
                        )}
                        {item.variant?.metafields?.find(m => m.namespace === 'custom' && m.key === 'verso_impression') && (
                          <Badge
                            variant="light"
                            color="gray"
                            radius="xl"
                            size="lg"
                            styles={{
                              root: {
                                fontWeight: 400,
                                color: 'var(--mantine-color-dark-6)'
                              }
                            }}
                          >
                            {item.variant?.metafields?.find(m => m.namespace === 'custom' && m.key === 'verso_impression')?.value}
                          </Badge>
                        )}
                      </Group>
                      {item.isCancelled && (
                        <Group gap="xs" className={styles.productActions}>
                          <Badge color="red">Annulé</Badge>
                        </Group>
                      )}

                      {(() => {
                        const checkedCount = useCheckedVariants({
                          orderId: encodeFirestoreId(order.id),
                          sku: item.sku || '',
                          color: transformColor(item.variantTitle?.split(' / ')[0] || ''),
                          size: item.variantTitle?.split(' / ')[1] || '',
                          index: itemIndex,
                          lineItemIndex: undefined,
                          quantity: item.quantity
                        });

                        return (
                          <Group align="center">
                            <div className={styles.variantCheckboxes}>
                              {Array.from({ length: item.quantity }).map((_, quantityIndex) => (
                                <VariantCheckbox
                                  key={`${item.id}-${quantityIndex}`}
                                  orderId={encodeFirestoreId(order.id)}
                                  sku={item.sku || ''}
                                  color={item.variantTitle?.split(' / ')[0] || ''}
                                  size={item.variantTitle?.split(' / ')[1] || ''}
                                  quantity={1}
                                  productIndex={itemIndex}
                                  quantityIndex={quantityIndex}
                                  disabled={true}
                                />
                              ))}
                            </div>
                            <Badge variant="outline">
                              {checkedCount}/{item.quantity}
                            </Badge>
                          </Group>
                        );
                      })()}
                      <Group gap="xs" mt="xs">
                        <Text size="sm" c="dimmed">
                          {formatItemString(item)}
                        </Text>
                        <Group gap={4}>
                          {(() => {
                            const price = Number(calculateItemPrice(formatItemString(item), rules));
                            const checkedCount = useCheckedVariants({
                              orderId: encodeFirestoreId(order.id),
                              sku: item.sku || '',
                              color: transformColor(item.variantTitle?.split(' / ')[0] || ''),
                              size: item.variantTitle?.split(' / ')[1] || '',
                              index: itemIndex,
                              lineItemIndex: undefined,
                              quantity: item.quantity
                            });
                            if (!checkedCount) return null;
                            return (
                              <Group gap={4}>
                                <Text size="sm" fw={500}>
                                  {price.toFixed(2)}€
                                </Text>
                                <Text size="sm" c="dimmed">
                                  x {checkedCount}
                                </Text>
                                <Text size="sm" fw={500}>
                                  {(price * checkedCount).toFixed(2)}€
                                </Text>
                              </Group>
                            );
                          })()} 
                        </Group>
                      </Group>
                    </div>
                  </div>

                </Paper>
            ))}
          </div>
        </div>
      </Stack>
    </Paper>
  );
}

function OrdersSection({ 
  title, 
  orders, 
  selectedOrder, 
  onSelect, 
  type,
  isReversed,
  toggleOrder 
}: { 
  title: string;
  orders: ShopifyOrder[];
  selectedOrder: ShopifyOrder | undefined;
  onSelect: (id: string) => void;
  type: string;
  isReversed: boolean;
  toggleOrder: () => void;
}) {
  return (
    <Stack gap="md">
      <Group justify="space-between" align="center">
        <Title order={2}>{title}</Title>
        <Tooltip label={isReversed ? 'Plus récentes d\'abord' : 'Plus anciennes d\'abord'}>
          <ActionIcon 
            variant="subtle" 
            onClick={toggleOrder}
            aria-label="Inverser l'ordre"
          >
            <IconArrowsSort />
          </ActionIcon>
        </Tooltip>
      </Group>
      <div className={styles.ordersGrid}>
        {orders.map(order => (
          <OrderRow
            key={order.id}
            order={order}
            isSelected={selectedOrder?.id === order.id}
            onSelect={onSelect}
          />
        ))}
      </div>
    </Stack>
  );
}

export function StockInvoicesPage() {
  const { 
    pendingOrders,
    orderStats,
    isReversed,
    toggleOrder,
    selectedOrder,
    isDrawerOpen,
    isLoading,
    onSelectOrder,
    onCloseDrawer
  } = useStockInvoicesPresenter();

  if (isLoading) {
    return (
      <Group justify="center" p="xl">
        <Loader />
      </Group>
    );
  }

  return (
    <div className={styles.main_content}>
      <Group justify="space-between" align="center">
        <Title order={1}>Facturation Stock</Title>
        <Group gap="xs">
          <Badge size="lg" variant="light" color="red">
            {orderStats.old} {'>'} 14j
          </Badge>
          <Badge size="lg" variant="light" color="orange">
            {orderStats.medium} 7-14j
          </Badge>
          <Badge size="lg" variant="light" color="green">
            {orderStats.recent} {'<'} 7j
          </Badge>
        </Group>
      </Group>

      <OrdersSection
        title="Commandes en attente"
        orders={pendingOrders}
        selectedOrder={selectedOrder}
        onSelect={onSelectOrder}
        type="pending"
        isReversed={isReversed}
        toggleOrder={toggleOrder}
      />

      <OrderDrawer
        order={selectedOrder}
        opened={isDrawerOpen}
        onClose={onCloseDrawer}
      />
    </div>
  );
}
