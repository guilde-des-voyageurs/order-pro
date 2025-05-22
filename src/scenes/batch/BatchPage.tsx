'use client';

import { Title, Text, Paper, Badge, Image, Group, Stack, Box, Tooltip, Modal, Loader } from '@mantine/core';
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
import { transformColor, colorMappings } from '@/utils/color-transformer';
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
              <div>
                <Text fw={500}>{order.name}</Text>
                <Text c="dimmed" size="sm">{formatDate(order.createdAt)}</Text>
                {order.note && (
                  <Badge
                    variant="light"
                    color="blue"
                    size="lg"
                    radius="sm"
                    mb="xs"
                    styles={{
                      root: {
                        textTransform: 'none',
                        fontWeight: 400
                      }
                    }}
                  >
                    {order.note}
                  </Badge>
                )}
              </div>
            </div>
            <div className={styles.orderWaiting}>
              <Group gap="xs">
                {order.tags?.map(tag => (
                  <Badge key={tag} size="sm" variant="light">{tag}</Badge>
                ))}
              </Group>
              <TextileProgress orderId={encodeFirestoreId(order.id)} />
            </div>
          </div>

          <div className={styles.productList}>
            {order.lineItems?.filter(item => !item.isCancelled).map((item) => (
              <Paper key={item.id} className={styles.productItem} p="md">
                <div className={styles.productContent}>
                  <Text className={styles.productQuantity} size="lg">× {item.quantity}</Text>
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
                    <Text size="sm" c="dimmed">
                      {item.sku} - {item.variantTitle?.split(' / ').map((variant, index) => {
                        if (index === 0) {
                          const cleanedVariant = variant.replace(/\s*\([^)]*\)\s*/g, '').trim();
                          const normalizedColor = cleanedVariant.toLowerCase()
                            .normalize('NFD')
                            .replace(/[\u0300-\u036f]/g, '');
                          const foundColor = Object.entries(colorMappings).find(([key]) => 
                            key.normalize('NFD').replace(/[\u0300-\u036f]/g, '') === normalizedColor
                          );
                          return foundColor ? foundColor[1].internalName : variant;
                        }
                        return variant;
                      }).join(' / ')}
                    </Text>
                    <Group gap="xs">
                      {item.variant?.metafields?.find(m => m.namespace === 'custom' && m.key === 'fichier_d_impression') && (
                        <>
                          <Stack gap="xs">
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
                            <Tooltip label="Cliquer pour copier le chemin d'accès local" position="right">
                              <Badge
                                variant="light" 
                                color="gray" 
                                radius="xl" 
                                size="lg"
                                fullWidth
                                styles={{ 
                                  root: { 
                                    whiteSpace: 'normal',
                                    height: 'auto',
                                    textAlign: 'left',
                                    lineHeight: 1.5,
                                    fontWeight: 400,
                                    color: 'var(--mantine-color-dark-6)',
                                    cursor: 'pointer',
                                    maxWidth: '20vw',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    '&:hover': {
                                      opacity: 0.8
                                    }
                                  } 
                                }}
                                onClick={() => {
                                  const folderName = item.title
                                    .replace(/\s*\|\s*/g, '')
                                    .replace(/\s*(t-shirt|unisexe|sweatshirt|débardeur)\s*/gi, '')
                                    .trim()
                                    .toUpperCase();
                                  const path = `\\\\EGIDE\\Atelier Textile\\PRODUCTION\\MOTIFS\\${folderName}`;
                                  clipboard.copy(path);
                                }}
                              >
                                {`./MOTIFS/${item.title
                                  .replace(/\s*\|\s*/g, '')
                                  .replace(/\s*(t-shirt|unisexe|sweatshirt|débardeur)\s*/gi, '')
                                  .trim()
                                  .toUpperCase()}\\${item.variant?.metafields?.find(m => m.namespace === 'custom' && m.key === 'fichier_d_impression')?.value || ''}_${item.variant?.metafields?.find(m => m.namespace === 'custom' && m.key === 'taille_d_impression')?.value || ''}.png`}
                              </Badge>
                            </Tooltip>
                          </Stack>
                        </>
                      )}


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
