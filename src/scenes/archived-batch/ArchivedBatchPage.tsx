'use client';

import { Title, Text, Loader, Table, Button, Group, Stack, Paper, Badge, Image, Checkbox, Alert, Modal, ActionIcon, Box, Tooltip, Select } from '@mantine/core';
import { useClipboard } from '@mantine/hooks';
import { useArchivedBatchPresenter } from './ArchivedBatchPage.presenter';
import { clsx } from 'clsx';
import { OrderDrawer } from '@/components/OrderDrawer/OrderDrawer';
import { InvoiceCheckbox } from '@/components/InvoiceCheckbox/InvoiceCheckbox';
import { TextileProgress } from '@/components/TextileProgress/TextileProgress';
import { DaysElapsed } from '@/components/DaysElapsed/DaysElapsed';
import { VariantCheckbox } from '@/components/VariantCheckbox';
import { FinancialStatus } from '@/components/FinancialStatus';
import { useInvoiceStatus } from '@/components/InvoiceCheckbox/InvoiceCheckbox';
import styles from '../batch/BatchPage.module.scss';
import { encodeFirestoreId } from '@/utils/firebase-helpers';
import { transformColor } from '@/utils/color-transformer';
import { colorMappings } from '@/utils/color-transformer';
import { generateVariantId, getSelectedOptions, getColorFromVariant, getSizeFromVariant } from '@/utils/variant-helpers';
import { IconMessage, IconAlertTriangle, IconArrowsSort } from '@tabler/icons-react';
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
              <Badge color="green" variant="light">Expédié</Badge>
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
                  style={item.isCancelled ? { display: 'none' } : undefined}
                >
                  <div className={styles.productContent}>
                    <div className={styles.productImageContainer}>
                      {item.image && (
                        <>
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
                          <Modal 
                            opened={selectedImage?.url === item.image.url} 
                            onClose={() => setSelectedImage(null)}
                            size="auto"
                            padding="xs"
                            centered
                          >
                            <Image
                              src={item.image.url}
                              alt={item.image.altText || item.title}
                              fit="contain"
                              maw="90vw"
                              mah="90vh"
                            />
                          </Modal>
                        </>
                      )}
                    </div>
                    <div>
                      <div className={styles.productInfo}>
                        <Text fw={500}>{item.title}</Text>
                        <Group gap="xs">
                          {item.sku && (
                            <Text size="sm" c="dimmed">{item.sku}</Text>
                          )}
                          {item.variantTitle && (
                            <Text size="sm" c="dimmed">
                              {item.variantTitle.split(' / ').map((variant) => transformColor(variant)).join(' / ')}
                            </Text>
                          )}
                          <Group gap="xs">
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
                        </Group>
                        <Group gap="xs" className={styles.productActions}>
                          <Badge color={item.isCancelled ? 'red' : 'blue'}>
                            {item.isCancelled ? 'Annulé' : `${item.quantity}x`}
                          </Badge>
                        </Group>
                      </div>
                      <div className={styles.variantCheckboxes}>
                        {Array.from({ length: item.quantity }).map((_, quantityIndex) => {
                          const selectedOptions = getSelectedOptions(item);
                          const color = getColorFromVariant(item);
                          const size = getSizeFromVariant(item);
                          const variantId = generateVariantId(
                            encodeFirestoreId(order.id),
                            item.sku || '',
                            color,
                            size,
                            index,
                            quantityIndex,
                            selectedOptions
                          );
                          return (
                            <VariantCheckbox
                              key={variantId}
                              orderId={encodeFirestoreId(order.id)}
                              sku={item.sku || ''}
                              color={color}
                              size={size}
                              quantity={1}
                              productIndex={index}
                              quantityIndex={quantityIndex}
                              disabled={item.isCancelled ?? false}
                              variantId={variantId}
                            />
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  <Stack gap="xs" mt="md" px="md">
                    {item.variant?.metafields?.find(m => m.namespace === 'custom' && m.key === 'fichier_d_impression') && (
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
                            const cleanTitle = item.title
                              .replace(/^(.+?)\s*\|.*$/, '$1')
                              .trim()
                              .toUpperCase();
                            const path = `/Utilisateurs/Mac/Desktop/NAS Runes de Chene/PRODUCTION/MOTIFS/${cleanTitle}`;

                            clipboard.copy(path);
                          }}
                        >
                          <Text span fw={700} inherit>
                            RECTO : {item.title
                              .replace(/^(.+?)\s*\|.*$/, '$1')
                              .trim()
                              .toUpperCase()}_{item.variant?.metafields?.find(m => m.namespace === 'custom' && m.key === 'fichier_d_impression')?.value}{item.variant?.metafields?.find(m => m.namespace === 'custom' && m.key === 'fichier_d_impression')?.value?.toUpperCase()?.includes('MARQUE') ? '_UNI' : `_${item.variant?.metafields?.find(m => m.namespace === 'custom' && m.key === 'taille_d_impression')?.value || ''}`}
                          </Text>
                        </Badge>
                      </Tooltip>
                    )}
                    {item.variant?.metafields?.find(m => m.namespace === 'custom' && m.key === 'verso_impression') && (
                      <Tooltip label="Cliquer pour copier le chemin d'accès local du verso" position="right">
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
                            const cleanTitle = item.title
                              .replace(/^(.+?)\s*\|.*$/, '$1')
                              .trim()
                              .toUpperCase();
                              const path = `/Utilisateurs/Mac/Desktop/NAS Runes de Chene/PRODUCTION/MOTIFS/${cleanTitle}`;

                            clipboard.copy(path);
                          }}
                        >
                          <Text span fw={700} inherit>
                            VERSO : {item.title
                              .replace(/^(.+?)\s*\|.*$/, '$1')
                              .trim()
                              .toUpperCase()}_{item.variant?.metafields?.find(m => m.namespace === 'custom' && m.key === 'verso_impression')?.value}{item.variant?.metafields?.find(m => m.namespace === 'custom' && m.key === 'verso_impression')?.value?.toUpperCase()?.includes('MARQUE') ? '_UNI' : `_${item.variant?.metafields?.find(m => m.namespace === 'custom' && m.key === 'taille_d_impression')?.value || ''}`}
                          </Text>
                        </Badge>
                      </Tooltip>
                    )}
                  </Stack>
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

interface OrderOptionType {
  value: string;
  label: string;
  order: ShopifyOrder;
}

export function ArchivedBatchPage() {
  const { 
    pendingOrders: orders,
    selectedOrder,
    isDrawerOpen,
    onSelectOrder,
    onCloseDrawer,
    isLoading,
    orderStats,
    isReversed,
    toggleOrder 
  } = useArchivedBatchPresenter();

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const currentOrder = orders.find(o => o.id === selectedOrderId);

  if (isLoading) {
    return <Loader />;
  }

  const orderOptions: OrderOptionType[] = orders.map(order => ({
    value: order.id,
    label: order.name,
    order: order
  }));

  return (
    <div className={styles.main_content}>
      <Stack gap="xl">
        <div>
          <Title order={1} mb="xs">Batchs archivés</Title>
          <Text size="sm" c="dimmed">Commandes batch expédiées</Text>
        </div>

        <Paper p="md" withBorder>
          <Stack gap="md">
            <Select
              label="Sélectionner une commande batch archivée"
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
                      <Badge color="green" variant="light">Expédiée</Badge>
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
              <div className={styles.ordersGrid}>
                <OrderRow
                  order={currentOrder}
                  isSelected={false}
                  onSelect={onSelectOrder}
                />
              </div>
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
