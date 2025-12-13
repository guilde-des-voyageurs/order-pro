'use client';

import { Title, Text, Loader, Table, Button, Group, Stack, Paper, Badge, Image, Checkbox, Alert, Modal, ActionIcon, Box, Tooltip } from '@mantine/core';
import { useClipboard } from '@mantine/hooks';
import { useBatchPresenter } from './BatchPage.presenter';
import { clsx } from 'clsx';
import { OrderDrawer } from '@/components/OrderDrawer/OrderDrawer';
import { InvoiceCheckbox } from '@/components/InvoiceCheckbox/InvoiceCheckbox';
import { TextileProgress } from '@/components/TextileProgress/TextileProgress';
import { DaysElapsed } from '@/components/DaysElapsed/DaysElapsed';
import { VariantCheckbox } from '@/components/VariantCheckbox';
import { FinancialStatus } from '@/components/FinancialStatus';
import { CleanVariantsButton } from '@/components/CleanVariantsButton/CleanVariantsButton';
import { BatchBillingNote } from '@/components/BatchBillingNote';
import styles from './BatchPage.module.scss';
import { encodeFirestoreId } from '@/utils/firebase-helpers';
import { transformColor } from '@/utils/color-transformer';
import { colorMappings } from '@/utils/color-transformer';
import { generateVariantId, getSelectedOptions, getColorFromVariant, getSizeFromVariant } from '@/utils/variant-helpers';
import { IconMessage, IconAlertTriangle, IconArrowsSort, IconRefresh, IconTrash, IconCheck } from '@tabler/icons-react';
import { useState } from 'react';
import type { ShopifyOrder } from '@/types/shopify';
import { db } from '@/firebase/db';
import { doc, setDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { notifications } from '@mantine/notifications';

interface OrderRowProps {
  order: ShopifyOrder;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDeleteAll: (order: ShopifyOrder) => void;
  onCheckAll: (order: ShopifyOrder) => void;
  onRecalculate: (order: ShopifyOrder) => void;
  isDeleting: boolean;
  isCheckingAll: boolean;
  isRecalculating: boolean;
}

function OrderRow({ order, isSelected, onSelect, onDeleteAll, onCheckAll, onRecalculate, isDeleting, isCheckingAll, isRecalculating }: OrderRowProps) {
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
            <Stack gap="md" style={{ width: '100%' }}>
              <Group gap="xs" align="flex-start">
                <InvoiceCheckbox 
                  orderId={encodeFirestoreId(order.id)} 
                  readOnly={order.displayFinancialStatus?.toLowerCase() === 'cancelled'} 
                />
                <CleanVariantsButton 
                  orderId={encodeFirestoreId(order.id)}
                  orderName={order.name}
                />
                <Box style={{ flex: 1, maxWidth: 400 }}>
                  <BatchBillingNote orderId={encodeFirestoreId(order.id)} />
                </Box>
              </Group>
              <Group gap="xs">
                <Button
                  leftSection={<IconTrash size={16} />}
                  variant="light"
                  color="red"
                  size="xs"
                  onClick={() => onDeleteAll(order)}
                  loading={isDeleting}
                >
                  Supprimer toutes les checkboxes
                </Button>
                <Button
                  leftSection={<IconCheck size={16} />}
                  variant="light"
                  color="green"
                  size="xs"
                  onClick={() => onCheckAll(order)}
                  loading={isCheckingAll}
                >
                  Cocher toutes les cases
                </Button>
                <Button
                  leftSection={<IconRefresh size={16} />}
                  variant="light"
                  color="blue"
                  size="xs"
                  onClick={() => onRecalculate(order)}
                  loading={isRecalculating}
                >
                  Recalculer le comptage
                </Button>
              </Group>
            </Stack>
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

export function BatchPage() {
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
  } = useBatchPresenter();

  const [selectedOrderForActions, setSelectedOrderForActions] = useState<ShopifyOrder | null>(null);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCheckingAll, setIsCheckingAll] = useState(false);

  const recalculateCheckboxCount = async (order: ShopifyOrder) => {
    setIsRecalculating(true);
    try {
      const encodedOrderId = encodeFirestoreId(order.id);
      
      // ÉTAPE 1 : Remettre à zéro le comptage
      await setDoc(doc(db, 'textile-progress-v2', encodedOrderId), {
        totalCount: 0,
        checkedCount: 0,
        updatedAt: new Date().toISOString()
      });
      
      // ÉTAPE 2 : Récupérer toutes les variantes cochées
      const variantsQuery = query(
        collection(db, 'variants-ordered-v2'),
        where('orderId', '==', encodedOrderId)
      );
      
      const variantsSnapshot = await getDocs(variantsQuery);
      
      let checkedCount = 0;
      variantsSnapshot.forEach(docSnap => {
        if (docSnap.data().checked === true) {
          checkedCount++;
        }
      });
      
      // ÉTAPE 3 : Calculer le total
      const totalCount = order.lineItems?.reduce((sum, item) => {
        return sum + (item.isCancelled ? 0 : item.quantity);
      }, 0) || 0;
      
      // ÉTAPE 4 : Mettre à jour
      await setDoc(doc(db, 'textile-progress-v2', encodedOrderId), {
        totalCount,
        checkedCount,
        updatedAt: new Date().toISOString()
      });
      
      notifications.show({
        title: 'Comptage recalculé',
        message: `${checkedCount}/${totalCount} checkboxes cochées`,
        color: 'green'
      });
    } catch (error) {
      console.error('Erreur lors du recalcul:', error);
      notifications.show({
        title: 'Erreur',
        message: 'Impossible de recalculer le comptage',
        color: 'red'
      });
    } finally {
      setIsRecalculating(false);
    }
  };

  const deleteAllCheckboxes = async (order: ShopifyOrder) => {
    setIsDeleting(true);
    try {
      const encodedOrderId = encodeFirestoreId(order.id);
      
      const variantsQuery = query(
        collection(db, 'variants-ordered-v2'),
        where('orderId', '==', encodedOrderId)
      );
      
      const variantsSnapshot = await getDocs(variantsQuery);
      
      const deletePromises = variantsSnapshot.docs.map(docSnap => {
        return deleteDoc(docSnap.ref);
      });
      
      await Promise.all(deletePromises);
      
      await setDoc(doc(db, 'textile-progress-v2', encodedOrderId), {
        totalCount: 0,
        checkedCount: 0,
        updatedAt: new Date().toISOString()
      });
      
      notifications.show({
        title: 'Checkboxes supprimées',
        message: `${variantsSnapshot.size} checkboxes ont été supprimées`,
        color: 'green'
      });
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      notifications.show({
        title: 'Erreur',
        message: 'Impossible de supprimer les checkboxes',
        color: 'red'
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const checkAllCheckboxes = async (order: ShopifyOrder) => {
    setIsCheckingAll(true);
    try {
      const encodedOrderId = encodeFirestoreId(order.id);
      
      let totalChecked = 0;
      
      const promises = order.lineItems?.flatMap((item, index) => {
        if (item.isCancelled) return [];
        
        const color = getColorFromVariant(item);
        const size = getSizeFromVariant(item);
        const selectedOptions = getSelectedOptions(item);
        
        return Array.from({ length: item.quantity }).map((_, quantityIndex) => {
          const variantId = generateVariantId(
            encodedOrderId,
            item.sku || '',
            color,
            size,
            index,
            quantityIndex,
            selectedOptions
          );
          
          totalChecked++;
          
          return setDoc(doc(db, 'variants-ordered-v2', variantId), {
            orderId: encodedOrderId,
            sku: item.sku || '',
            color,
            size,
            productIndex: index,
            quantityIndex,
            checked: true,
            updatedAt: new Date().toISOString()
          });
        });
      }) || [];
      
      await Promise.all(promises);
      
      const totalCount = order.lineItems?.reduce((sum, item) => {
        return sum + (item.isCancelled ? 0 : item.quantity);
      }, 0) || 0;
      
      await setDoc(doc(db, 'textile-progress-v2', encodedOrderId), {
        totalCount,
        checkedCount: totalChecked,
        updatedAt: new Date().toISOString()
      });
      
      notifications.show({
        title: 'Checkboxes cochées',
        message: `${totalChecked} checkboxes ont été cochées`,
        color: 'green'
      });
    } catch (error) {
      console.error('Erreur lors du cochage:', error);
      notifications.show({
        title: 'Erreur',
        message: 'Impossible de cocher toutes les checkboxes',
        color: 'red'
      });
    } finally {
      setIsCheckingAll(false);
    }
  };

  if (isLoading) {
    return <Loader />;
  }

  return (
    <div className={styles.main_content}>
      <Group justify="space-between" align="center" mb="md">
        <Title order={1}>Commandes par lots</Title>
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
        </Group>
      </Alert>

      <OrdersSection
        title="Batchs"
        orders={pendingOrders}
        selectedOrder={selectedOrder}
        onSelect={onSelectOrder}
        type="pending"
        isReversed={isReversed}
        toggleOrder={toggleOrder}
        onDeleteAll={deleteAllCheckboxes}
        onCheckAll={checkAllCheckboxes}
        onRecalculate={recalculateCheckboxCount}
        isDeleting={isDeleting}
        isCheckingAll={isCheckingAll}
        isRecalculating={isRecalculating}
      />

      <OrderDrawer
        order={selectedOrder}
        opened={isDrawerOpen}
        onClose={onCloseDrawer}
      />
    </div>
  );
}

function OrdersSection({ 
  title, 
  orders, 
  selectedOrder, 
  onSelect, 
  type,
  isReversed,
  toggleOrder,
  onDeleteAll,
  onCheckAll,
  onRecalculate,
  isDeleting,
  isCheckingAll,
  isRecalculating
}: { 
  title: string;
  orders: ShopifyOrder[];
  selectedOrder: ShopifyOrder | undefined;
  onSelect: (id: string) => void;
  type: string;
  isReversed: boolean;
  toggleOrder: () => void;
  onDeleteAll: (order: ShopifyOrder) => void;
  onCheckAll: (order: ShopifyOrder) => void;
  onRecalculate: (order: ShopifyOrder) => void;
  isDeleting: boolean;
  isCheckingAll: boolean;
  isRecalculating: boolean;
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
              onDeleteAll={onDeleteAll}
              onCheckAll={onCheckAll}
              onRecalculate={onRecalculate}
              isDeleting={isDeleting}
              isCheckingAll={isCheckingAll}
              isRecalculating={isRecalculating}
            />
          ))}
        </div>
      </Stack>
    </div>
  );
}
