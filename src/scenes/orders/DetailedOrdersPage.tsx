'use client';

import { Title, Text, Loader, Table, Button, Group, Stack, Paper, Badge, Image, Checkbox, Alert } from '@mantine/core';
import { useDetailedOrdersPagePresenter } from './DetailedOrdersPage.presenter';
import { clsx } from 'clsx';
import { OrderDrawer } from '@/components/OrderDrawer/OrderDrawer';
import { InvoiceCheckbox } from '@/components/InvoiceCheckbox/InvoiceCheckbox';
import { TextileProgress } from '@/components/TextileProgress/TextileProgress';
import { DaysElapsed } from '@/components/DaysElapsed/DaysElapsed';
import { VariantCheckbox } from '@/components/VariantCheckbox';
import { FinancialStatus } from '@/components/FinancialStatus';
import styles from './DetailedOrdersPage.module.scss';
import { encodeFirestoreId } from '@/utils/firebase-helpers';
import { transformColor } from '@/utils/color-transformer';
import { colorMappings } from '@/utils/color-transformer';
import { generateVariantId } from '@/utils/variant-helpers';
import { IconMessage, IconAlertTriangle } from '@tabler/icons-react';
import type { ShopifyOrder } from '@/types/shopify';

interface OrderRowProps {
  order: ShopifyOrder;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

function OrderRow({ order, isSelected, onSelect }: OrderRowProps) {
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
            <InvoiceCheckbox orderId={encodeFirestoreId(order.id)} readOnly />
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
                    <div className={styles.productImageContainer}>
                      {item.image && (
                        <Image
                          className={styles.productImage}
                          src={item.image.url}
                          alt={item.image.altText || item.title}
                          w={100}
                          h={100}
                          fit="contain"
                        />
                      )}
                    </div>
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
                      </Group>
                    </div>
                    <Group gap="xs" className={styles.productActions}>
                      <Badge color={item.isCancelled ? 'red' : 'blue'}>
                        {item.isCancelled ? 'Annulé' : `${item.quantity}x`}
                      </Badge>
                      <Group gap="xs">
                        {Array.from({ length: item.quantity }).map((_, quantityIndex) => (
                          <VariantCheckbox
                            key={`${item.id}-${quantityIndex}`}
                            orderId={encodeFirestoreId(order.id)}
                            sku={item.sku || ''}
                            color={item.variantTitle?.split(' / ')[0] || ''}
                            size={item.variantTitle?.split(' / ')[1] || ''}
                            quantity={1}
                            productIndex={index}
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
                      </Group>
                    </Group>
                  </div>
                </Paper>
              ))}
            </div>
          </div>
        </Stack>
        {order.note && (
          <Alert icon={<IconMessage size="1rem" />} color="blue" variant="light">
            {order.note}
          </Alert>
        )}
      </Paper>
  );
}

function OrdersSection({ title, orders, selectedOrder, onSelect, type }: { 
  title: string;
  orders: ShopifyOrder[];
  selectedOrder: ShopifyOrder | undefined;
  onSelect: (id: string) => void;
  type: string;
}) {
  return (
    <div className={styles.section}>
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Title order={2}>{title}</Title>
          <Text size="sm" c="dimmed">
            {orders.length} commande{orders.length > 1 ? 's' : ''}
          </Text>
        </Group>

        <div className={styles.ordersGrid}>
          {orders.map((order) => (
            <OrderRow
              key={order.id}
              order={order}
              isSelected={selectedOrder?.id === order.id}
              onSelect={onSelect}
            />
          ))}
        </div>
      </Stack>
    </div>
  );
}

export function DetailedOrdersPage() {
  const { 
    pendingOrders, 
    shippedOrders, 
    selectedOrder,
    isDrawerOpen,
    onSelectOrder,
    onCloseDrawer,
    isLoading 
  } = useDetailedOrdersPagePresenter();

  if (isLoading) {
    return <Loader />;
  }

  return (
    <div className={styles.main_content}>
      <Title order={1}>Commandes détaillées</Title>

      <Alert 
        icon={<IconAlertTriangle size={16} />}
        title="Penser à :"
        color="gray"
        variant="light"
      >
        <Group gap="sm">
          <Badge size="lg" variant="light" color="gray">retirer les étiquettes du produit</Badge>
          <Badge size="lg" variant="light" color="gray">glisser le mot de remerciement</Badge>
          <Badge size="lg" variant="light" color="gray">le sticker</Badge>
          <Badge size="lg" variant="light" color="gray">le micro-flyer Wanderers</Badge>
        </Group>
      </Alert>

      <OrdersSection
        title="Commandes en cours"
        orders={pendingOrders}
        selectedOrder={selectedOrder}
        onSelect={onSelectOrder}
        type="pending"
      />

      <OrderDrawer
        order={selectedOrder}
        opened={isDrawerOpen}
        onClose={onCloseDrawer}
      />
    </div>
  );
}
