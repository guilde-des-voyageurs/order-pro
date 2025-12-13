'use client';

import { Title, Text, Loader, Table, Button, Group, Stack, Paper, Badge, Image, Checkbox, Alert, Modal, ActionIcon, Box, Tooltip, Pagination } from '@mantine/core';
import { useClipboard } from '@mantine/hooks';
import { useArchivedOrdersPagePresenter } from './ArchivedOrdersPage.presenter';
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
import { IconMessage, IconArrowsSort, IconRefresh } from '@tabler/icons-react';
import { useState } from 'react';
import type { ShopifyOrder } from '@/types/shopify';
import { db } from '@/firebase/db';
import { collection, query, where, getDocs, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { notifications } from '@mantine/notifications';

interface OrderRowProps {
  order: ShopifyOrder;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

function OrderRow({ order, isSelected, onSelect }: OrderRowProps) {
  const clipboard = useClipboard();
  const [selectedImage, setSelectedImage] = useState<{ url: string; alt: string } | null>(null);
  const [isPurging, setIsPurging] = useState(false);

  const handlePurgeAndRecalculate = async () => {
    const orderId = encodeFirestoreId(order.id);
    
    setIsPurging(true);
    
    try {
      // 1. Récupérer l'état actuel des checkboxes (avant suppression)
      const variantsRef = collection(db, 'variants-ordered-v2');
      const q = query(variantsRef, where('orderId', '==', orderId));
      const snapshot = await getDocs(q);
      
      // Créer un Set des anciennes checkboxes cochées (par SKU-couleur-taille)
      const checkedVariants = new Set<string>();
      snapshot.docs.forEach(docSnapshot => {
        const data = docSnapshot.data();
        if (data.checked) {
          checkedVariants.add(`${data.sku}--${data.color}--${data.size}`);
        }
      });
      
      // 2. Supprimer tous les anciens documents
      const deletePromises = snapshot.docs.map(docSnapshot => deleteDoc(docSnapshot.ref));
      await Promise.all(deletePromises);
      
      // 3. Calculer le nombre total d'items valides (non annulés)
      const totalCount = order.lineItems?.reduce((acc, item) => {
        if (item.isCancelled) return acc;
        return acc + item.quantity;
      }, 0) || 0;
      
      // 4. Recréer les documents avec les BONS IDs en préservant l'état coché
      const createPromises: Promise<void>[] = [];
      let checkedCount = 0;
      
      order.lineItems?.forEach((item, index) => {
        if (item.isCancelled) return; // Ignorer les items annulés
        
        const color = getColorFromVariant(item);
        const size = getSizeFromVariant(item);
        const selectedOptions = getSelectedOptions(item);
        const variantKey = `${item.sku}--${color}--${size}`;
        
        for (let quantityIndex = 0; quantityIndex < item.quantity; quantityIndex++) {
          const variantId = generateVariantId(
            orderId,
            item.sku || '',
            color,
            size,
            index,
            quantityIndex,
            selectedOptions
          );
          
          // Vérifier si cette variante était cochée avant
          const wasChecked = checkedVariants.has(variantKey);
          if (wasChecked) checkedCount++;
          
          const variantDoc = {
            checked: wasChecked,
            sku: item.sku || '',
            color: color,
            size: size,
            originalId: order.id,
            updatedAt: new Date().toISOString(),
            orderId: orderId
          };
          
          createPromises.push(setDoc(doc(db, 'variants-ordered-v2', variantId), variantDoc));
        }
      });
      
      await Promise.all(createPromises);
      
      // 5. Mettre à jour le document textile-progress-v2 avec le décompte recalculé
      const progressRef = doc(db, 'textile-progress-v2', orderId);
      await setDoc(progressRef, {
        checkedCount,
        totalCount,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      notifications.show({
        title: 'Décompte purgé et recalculé',
        message: `${order.name}: ${checkedCount}/${totalCount}`,
        color: 'green',
      });
    } catch (error) {
      console.error('Erreur lors de la purge:', error);
      notifications.show({
        title: 'Erreur',
        message: 'Impossible de purger et recalculer le décompte',
        color: 'red',
      });
    } finally {
      setIsPurging(false);
    }
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
              <Button
                size="xs"
                variant="light"
                color="orange"
                leftSection={<IconRefresh size={14} />}
                onClick={handlePurgeAndRecalculate}
                loading={isPurging}
              >
                Purger et recalculer
              </Button>
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

export function ArchivedOrdersPage() {
  const { 
    archivedOrders,
    totalOrders,
    currentPage,
    totalPages,
    handlePageChange,
    selectedOrder,
    isDrawerOpen,
    onSelectOrder,
    onCloseDrawer,
    isLoading,
    isReversed,
    toggleOrder 
  } = useArchivedOrdersPagePresenter();

  if (isLoading) {
    return <Loader />;
  }

  return (
    <div className={styles.main_content}>
      <Group justify="space-between" align="center" mb="md">
        <Title order={1}>Commandes archivées</Title>
        <Badge 
          size="xl" 
          variant="filled" 
          color="green.2"
          c="green.9"
        >
          {totalOrders} commande{totalOrders > 1 ? 's' : ''} archivée{totalOrders > 1 ? 's' : ''}
        </Badge>
      </Group>

      {totalPages > 1 && (
        <Group justify="center" mb="xl">
          <Pagination 
            total={totalPages} 
            value={currentPage} 
            onChange={handlePageChange}
            size="lg"
          />
        </Group>
      )}

      <OrdersSection
        title="Commandes expédiées"
        orders={archivedOrders}
        selectedOrder={selectedOrder}
        onSelect={onSelectOrder}
        type="archived"
        isReversed={isReversed}
        toggleOrder={toggleOrder}
      />

      {totalPages > 1 && (
        <Group justify="center" mt="xl">
          <Pagination 
            total={totalPages} 
            value={currentPage} 
            onChange={handlePageChange}
            size="lg"
          />
        </Group>
      )}

      <OrderDrawer
        order={selectedOrder}
        opened={isDrawerOpen}
        onClose={onCloseDrawer}
      />
    </div>
  );
}
