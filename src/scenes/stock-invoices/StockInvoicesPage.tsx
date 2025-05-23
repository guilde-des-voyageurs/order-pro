'use client';

import { Title, Text, Loader, Table, Button, Group, Stack, Paper, Badge, Checkbox, Alert, ActionIcon, Tooltip } from '@mantine/core';
import { useStockInvoicesPresenter } from './StockInvoicesPage.presenter';
import { clsx } from 'clsx';
import { OrderDrawer } from '@/components/OrderDrawer/OrderDrawer';
import { InvoiceCheckbox } from '@/components/InvoiceCheckbox/InvoiceCheckbox';
import { TextileProgress } from '@/components/TextileProgress/TextileProgress';
import { DaysElapsed } from '@/components/DaysElapsed/DaysElapsed';
import { VariantCheckbox } from '@/components/VariantCheckbox';
import { FinancialStatus } from '@/components/FinancialStatus';
import styles from './StockInvoicesPage.module.scss';
import { encodeFirestoreId } from '@/utils/firebase-helpers';
import { transformColor } from '@/utils/color-transformer';
import { colorMappings } from '@/utils/color-transformer';

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

  // Construire la chaîne finale
  const parts = [sku, transformedColor, size, printFile].filter(Boolean);
  return parts.join(' - ');
}
import { generateVariantId, getDefaultSku, calculateGlobalVariantIndex } from '@/utils/variant-helpers';
import { IconMessage, IconAlertTriangle, IconArrowsSort } from '@tabler/icons-react';
import { useState } from 'react';
import type { ShopifyOrder } from '@/types/shopify';
import { usePriceRules, calculateItemPrice } from '@/hooks/usePriceRules';

interface OrderRowProps {
  order: ShopifyOrder;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

function OrderRow({ order, isSelected, onSelect }: OrderRowProps) {
  const { rules } = usePriceRules();
  return (
    <Paper className={styles.orderRow} withBorder>
      <Stack gap="md">
        <div className={styles.orderInfo}>
          <div className={styles.orderHeader}>
            <div className={styles.orderTitle}>
              <Text fw={500}>{order.name}</Text>
              <FinancialStatus status={order.displayFinancialStatus} />
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
            <InvoiceCheckbox 
              orderId={encodeFirestoreId(order.id)} 
              readOnly={order.displayFinancialStatus?.toLowerCase() === 'cancelled'} 
            />
          </div>
        </div>

        <div className={styles.orderItems}>
          <div className={styles.productList}>
            {order.lineItems?.map((item, index) => (
                <Paper 
                  key={item.id} 
                  className={clsx(styles.productItem, { [styles.cancelled]: item.isCancelled })}
                  withBorder
                  p="md"
                >
                  <div className={styles.productContent}>
                    <div className={styles.productInfo}>
                      <Text fw={500}>{item.title}</Text>
                      <Group gap="xs">
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
                      </Group>
                      <Group gap="xs" className={styles.productActions}>
                        <Badge color={item.isCancelled ? 'red' : 'blue'}>
                          {item.isCancelled ? 'Annulé' : `${item.quantity}x`}
                        </Badge>
                      </Group>
                      <div className={styles.variantCheckboxes}>
                        {Array.from({ length: item.quantity }).map((_, quantityIndex) => (
                          <VariantCheckbox
                            key={`${item.id}-${quantityIndex}`}
                            orderId={encodeFirestoreId(order.id)}
                            sku={item.sku || ''}
                            color={item.variantTitle?.split(' / ')[0] || ''}
                            size={item.variantTitle?.split(' / ')[1] || ''}
                            quantity={1}
                            productIndex={index}
                            disabled={item.isCancelled ?? false}
                            variantId={generateVariantId(
                              encodeFirestoreId(order.id),
                              item.sku || '',
                              item.variantTitle?.split(' / ')[0] || '',
                              item.variantTitle?.split(' / ')[1] || '',
                              quantityIndex,
                              index
                            )}
                          />
                        ))}
                      </div>
                      <Group gap="xs" mt="xs">
                        <Text size="sm" c="dimmed">
                          {formatItemString(item)}
                        </Text>
                        <Text size="sm" fw={500}>
                          {calculateItemPrice(formatItemString(item), rules).toFixed(2)}€
                        </Text>
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
