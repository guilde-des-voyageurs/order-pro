'use client';

import { Title, Text, Loader, Paper, Stack } from '@mantine/core';
import { useClipboard } from '@mantine/hooks';
import { useBatchPresenter } from './BatchPage.presenter';
import { OrderDrawer } from '@/components/OrderDrawer/OrderDrawer';
import { InvoiceCheckbox } from '@/components/InvoiceCheckbox/InvoiceCheckbox';
import { TextileProgress } from '@/components/TextileProgress/TextileProgress';
import { DaysElapsed } from '@/components/DaysElapsed/DaysElapsed';
import { VariantCheckbox } from '@/components/VariantCheckbox';
import { FinancialStatus } from '@/components/FinancialStatus';
import styles from './BatchPage.module.scss';
import { encodeFirestoreId } from '@/utils/firebase-helpers';
import { generateVariantId } from '@/utils/variant-helpers';
import { useState } from 'react';
import type { ShopifyOrder } from '@/types/shopify';

interface OrderRowProps {
  order: ShopifyOrder;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

function OrderRow({ order, isSelected, onSelect }: OrderRowProps) {
  const clipboard = useClipboard();
  const [selectedImage, setSelectedImage] = useState<{ url: string; alt: string } | null>(null);

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

        <div className={styles.lineItems}>
          {order.lineItems?.map((item) => (
            <div key={item.id} className={styles.lineItem}>
              <div className={styles.lineItemHeader}>
                <Text size="sm" fw={500}>{item.title}</Text>
                <Text size="sm" c="dimmed">{item.variantTitle}</Text>
              </div>
              
              <div className={styles.lineItemDetails}>
                <div className={styles.variantInfo}>
                  <Text size="sm">SKU: {item.sku}</Text>
                  <Text size="sm">Qté: {item.quantity}</Text>
                </div>
                
                <div className={styles.variantProgress}>
                  {Array.from({ length: item.quantity || 0 }).map((_, quantityIndex) => (
                    <VariantCheckbox 
                      key={`${order.id}-${item.sku}-${quantityIndex}`}
                      orderId={encodeFirestoreId(order.id)} 
                      variantId={generateVariantId(
                        encodeFirestoreId(order.id),
                        item.sku || '',
                        item.variantTitle?.split(' / ')[0] || '',
                        item.variantTitle?.split(' / ')[1] || '',
                        quantityIndex,
                        0
                      )}
                      sku={item.sku || ''}
                      color={item.variantTitle?.split(' / ')[0] || ''}
                      size={item.variantTitle?.split(' / ')[1] || ''}
                      quantity={1}
                      productIndex={quantityIndex}
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Stack>
    </Paper>
  );
}

export function BatchPage() {
  const { 
    isLoading, 
    error, 
    orders, 
    selectedOrder,
    handleOrderSelect 
  } = useBatchPresenter();

  if (isLoading) {
    return (
      <div className={styles.main_content}>
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.main_content}>
        <Text c="red">Une erreur est survenue lors du chargement des commandes.</Text>
      </div>
    );
  }

  return (
    <div className={styles.main_content}>
      <Title>Commandes par lots</Title>
      
      <div className={styles.ordersGrid}>
        {orders.map((order) => (
          <OrderRow
            key={order.id}
            order={order}
            isSelected={selectedOrder?.id === order.id}
            onSelect={handleOrderSelect}
          />
        ))}
      </div>

      <OrderDrawer 
        order={selectedOrder}
        onClose={() => handleOrderSelect('')}
        opened={!!selectedOrder}
      />
    </div>
  );
}
