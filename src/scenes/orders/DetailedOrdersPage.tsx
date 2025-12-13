'use client';

import { Title, Text, Loader, Table, Button, Group, Stack, Paper, Badge, Image, Checkbox, Alert, Modal, ActionIcon, Box, Tooltip } from '@mantine/core';
import { useClipboard } from '@mantine/hooks';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
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
import { generateVariantId, getSelectedOptions, getColorFromVariant, getSizeFromVariant } from '@/utils/variant-helpers';
import { IconMessage, IconAlertTriangle, IconArrowsSort, IconCheck } from '@tabler/icons-react';
import { useState } from 'react';
import type { ShopifyOrder } from '@/types/shopify';
import { ordersService } from '@/firebase/services/orders';

interface OrderRowProps {
  order: ShopifyOrder;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

function OrderRow({ order, isSelected, onSelect }: OrderRowProps) {
  const clipboard = useClipboard();
  const [selectedImage, setSelectedImage] = useState<{ url: string; alt: string } | null>(null);
  const [isMarkingAsFulfilled, setIsMarkingAsFulfilled] = useState(false);

  const handleMarkAsFulfilled = () => {
    modals.openConfirmModal({
      title: 'Marquer comme expédié',
      children: (
        <Text size="sm">
          Êtes-vous sûr de vouloir marquer la commande <strong>{order.name}</strong> comme expédiée ?
          <br /><br />
          Cette action changera son statut à "FULFILLED" et la fera disparaître de cette page.
        </Text>
      ),
      labels: { confirm: 'Marquer comme expédié', cancel: 'Annuler' },
      confirmProps: { color: 'green' },
      onConfirm: async () => {
        setIsMarkingAsFulfilled(true);
        try {
          await ordersService.markOrderAsFulfilled(order.id);
          notifications.show({
            title: 'Succès',
            message: `La commande ${order.name} a été marquée comme expédiée`,
            color: 'green',
          });
        } catch (error) {
          console.error('Erreur lors du marquage:', error);
          notifications.show({
            title: 'Erreur',
            message: 'Impossible de marquer la commande comme expédiée',
            color: 'red',
          });
        } finally {
          setIsMarkingAsFulfilled(false);
        }
      },
    });
  };

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
            <Group gap="xs">
              <InvoiceCheckbox orderId={encodeFirestoreId(order.id)} readOnly />
              <Button
                size="xs"
                variant="light"
                color="green"
                leftSection={<IconCheck size={14} />}
                onClick={handleMarkAsFulfilled}
                loading={isMarkingAsFulfilled}
              >
                Marquer comme expédié
              </Button>
            </Group>
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
                    </div>
                    <Group gap="xs" className={styles.productActions}>
                      <Badge color={item.isCancelled ? 'red' : 'blue'}>
                        {item.isCancelled ? 'Annulé' : `${item.quantity}x`}
                      </Badge>
                      {item.isCancelled && (
                        <Badge color="red">
                          Annulé
                        </Badge>
                      )}
                    </Group>
                    <Group gap="xs">
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
                            variantId={variantId}
                          />
                      )})}
                    </Group>
                  </div>
                  {(item.variant?.metafields?.find(m => m.namespace === 'custom' && m.key === 'fichier_d_impression') || 
                    item.variant?.metafields?.find(m => m.namespace === 'custom' && m.key === 'verso_impression')) && (
                    <Box mt="md" px="md">
                      <Group gap="xs">
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
                                        const path = `/Utilisateurs/Mac/Desktop/NAS Runes de Chene/PRODUCTION/MOTIFS/${cleanTitle}`;

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
                                        const path = `/Utilisateurs/Mac/Desktop/NAS Runes de Chene/PRODUCTION/MOTIFS/${cleanTitle}`;

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
                      </Group>
                    </Box>
                  )}
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
    <div className={styles.section}>
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Title order={2}>{title}</Title>
          <Group gap="xs">
            <Text size="sm" c="dimmed">
              {orders.length} commande{orders.length > 1 ? 's' : ''}
            </Text>
            <ActionIcon 
              variant="subtle" 
              color="gray"
              onClick={toggleOrder}
              title={isReversed ? "Plus récentes d'abord" : "Plus anciennes d'abord"}
            >
              <IconArrowsSort
                style={{ 
                  transform: isReversed ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.2s ease'
                }} 
                size="1.2rem"
              />
            </ActionIcon>
          </Group>
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
    selectedOrder,
    isDrawerOpen,
    onSelectOrder,
    onCloseDrawer,
    isLoading,
    orderStats,
    isReversed,
    toggleOrder 
  } = useDetailedOrdersPagePresenter();

  if (isLoading) {
    return <Loader />;
  }

  return (
    <div className={styles.main_content}>
      <Group justify="space-between" align="center" mb="md">
        <Title order={1}>Commandes détaillées</Title>
        <Group>
          <Badge 
            size="xl" 
            variant="filled" 
            color="red.3"
            c="red.9"
            leftSection={orderStats.old}
          >
            {orderStats.old > 1 ? 'commandes' : 'commande'} {'>'}14j
          </Badge>
          <Badge 
            size="xl" 
            variant="filled" 
            color="yellow.2"
            c="yellow.9"
            leftSection={orderStats.medium}
          >
            {orderStats.medium > 1 ? 'commandes' : 'commande'} 7-14j
          </Badge>
          <Badge 
            size="xl" 
            variant="filled" 
            color="green.2"
            c="green.9"
            leftSection={orderStats.recent}
          >
            {orderStats.recent > 1 ? 'commandes' : 'commande'} {'<'}7j
          </Badge>
        </Group>
      </Group>

      <Alert 
        icon={<IconAlertTriangle size={16} />}
        title="Penser à :"
        color="gray"
        variant="light"
      >
        <Group gap="sm">
          <Badge size="lg" variant="light" color="gray">retirer les étiquettes Stanley</Badge>
          <Badge size="lg" variant="light" color="gray">glisser le mot de remerciement</Badge>
          <Badge size="lg" variant="light" color="gray">le sticker</Badge>
          <Badge size="lg" variant="light" color="gray">le Flyer !</Badge>
        </Group>
      </Alert>

      <OrdersSection
        title="Commandes en cours"
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
