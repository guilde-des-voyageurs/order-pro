'use client';

import { Title, Text, Stack, Group, Loader, Image, Modal, Paper } from '@mantine/core';
import { useClipboard } from '@mantine/hooks';
import { useBatchPresenter } from './BatchPage.presenter';
import { OrderDrawer } from '@/components/OrderDrawer/OrderDrawer';
import { InvoiceCheckbox } from '@/components/InvoiceCheckbox/InvoiceCheckbox';
import { TextileProgress } from '@/components/TextileProgress/TextileProgress';
import { DaysElapsed } from '@/components/DaysElapsed/DaysElapsed';
import { VariantCheckbox } from '@/components/VariantCheckbox';
import { FinancialStatus } from '@/components/FinancialStatus';
import { OrderVariantList } from '@/components/OrderVariantList';
import styles from './BatchPage.module.scss';
import { encodeFirestoreId } from '@/utils/firebase-helpers';
import { generateVariantId } from '@/utils/variant-helpers';
import { formatDate } from '@/utils/date-helpers';
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
              <Text fw={500}>#{order.name}</Text>
              <Text c="dimmed" size="sm">{formatDate(order.createdAt)}</Text>
            </div>
            <div className={styles.orderWaiting}>
              <TextileProgress orderId={encodeFirestoreId(order.id)} />
            </div>
          </div>

          <div className={styles.productList}>
            <OrderVariantList 
              orderId={encodeFirestoreId(order.id)} 
              variants={order.lineItems?.map(item => ({
                sku: item.sku || '',
                color: item.variantTitle?.split(' / ')[0] || '',
                size: item.variantTitle?.split(' / ')[1] || '',
                quantity: item.quantity
              })) || []} 
            />
            {order.lineItems?.map((item) => (
              <Paper key={item.id} className={styles.productItem} p="md">
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
                        style={{ cursor: 'pointer' }}
                        onClick={() => item.image && setSelectedImage({ 
                          url: item.image.url, 
                          alt: item.image.altText || item.title 
                        })}
                      />
                    )}
                  </div>
                  <div className={styles.productInfo}>
                    <Text fw={500}>{item.title}</Text>
                    <Text size="sm" c="dimmed">{item.variantTitle}</Text>
                    <Group gap="xs">
                      <Text size="sm">SKU: {item.sku}</Text>
                      <Text size="sm">Qté: {item.quantity}</Text>
                    </Group>
                  </div>
                  <div>
                    <Group gap="xs">
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
                    </Group>
                  </div>
                </div>
              </Paper>
            ))}
          </div>
        </div>
      </Stack>
      {selectedImage && (
        <Modal 
          opened={!!selectedImage} 
          onClose={() => setSelectedImage(null)}
          size="auto"
          padding="xs"
          centered
        >
          <Image
            src={selectedImage.url}
            alt={selectedImage.alt}
            fit="contain"
            maw="90vw"
            mah="90vh"
          />
        </Modal>
      )}
    </Paper>
  );
}

export function BatchPage() {
  const { orders, selectedOrder, isLoading, error, handleOrderSelect } = useBatchPresenter();
  if (isLoading) {
    return (
      <div className={styles.main_content}>
        <Title order={2}>Stock</Title>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
          <Loader />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.main_content}>
        <Title order={2}>Stock</Title>
        <div style={{ marginTop: '2rem' }}>
          <Text c="red">Une erreur est survenue lors du chargement des commandes.</Text>
        </div>
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
