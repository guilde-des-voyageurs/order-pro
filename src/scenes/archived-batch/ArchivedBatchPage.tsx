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
import { BatchBillingNote } from '@/components/BatchBillingNote';
import styles from '../batch/BatchPage.module.scss';
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
            <Group gap="xs" align="flex-start">
              <InvoiceCheckbox 
                orderId={encodeFirestoreId(order.id)} 
                readOnly={order.displayFinancialStatus?.toLowerCase() === 'cancelled'} 
              />
              <Box style={{ flex: 1, maxWidth: 400 }}>
                <BatchBillingNote orderId={encodeFirestoreId(order.id)} />
              </Box>
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
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCheckingAll, setIsCheckingAll] = useState(false);
  const currentOrder = orders.find(o => o.id === selectedOrderId);

  const recalculateCheckboxCount = async () => {
    if (!currentOrder) return;

    setIsRecalculating(true);
    try {
      const encodedOrderId = encodeFirestoreId(currentOrder.id);
      
      console.log('=== RECALCUL DU COMPTAGE ===');
      console.log('Order ID:', currentOrder.id);
      console.log('Encoded ID:', encodedOrderId);
      
      // ÉTAPE 1 : Remettre à zéro le comptage
      await setDoc(doc(db, 'textile-progress-v2', encodedOrderId), {
        totalCount: 0,
        checkedCount: 0,
        updatedAt: new Date().toISOString()
      });
      
      console.log('Comptage remis à zéro');
      
      // ÉTAPE 2 : Récupérer toutes les variantes cochées pour cette commande
      const variantsQuery = query(
        collection(db, 'variants-ordered-v2'),
        where('orderId', '==', encodedOrderId)
      );
      
      const variantsSnapshot = await getDocs(variantsQuery);
      
      console.log('Nombre de documents variants trouvés:', variantsSnapshot.size);
      
      // Compter les variantes cochées
      let checkedCount = 0;
      variantsSnapshot.forEach(docSnap => {
        const data = docSnap.data();
        console.log('Variant:', docSnap.id, 'checked:', data.checked);
        if (data.checked === true) {
          checkedCount++;
        }
      });
      
      console.log('Checkboxes cochées comptées:', checkedCount);
      
      // ÉTAPE 3 : Calculer le total (articles non annulés)
      const totalCount = currentOrder.lineItems?.reduce((sum, item) => {
        return sum + (item.isCancelled ? 0 : item.quantity);
      }, 0) || 0;
      
      console.log('Total articles (non annulés):', totalCount);
      
      // ÉTAPE 4 : Mettre à jour avec les nouvelles valeurs
      await setDoc(doc(db, 'textile-progress-v2', encodedOrderId), {
        totalCount,
        checkedCount,
        updatedAt: new Date().toISOString()
      });
      
      console.log('Comptage mis à jour:', `${checkedCount}/${totalCount}`);
      
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

  const deleteAllCheckboxes = async () => {
    if (!currentOrder) return;

    setIsDeleting(true);
    try {
      const encodedOrderId = encodeFirestoreId(currentOrder.id);
      
      console.log('=== SUPPRESSION DES CHECKBOXES ===');
      console.log('Order ID:', currentOrder.id);
      console.log('Encoded ID:', encodedOrderId);
      
      // Récupérer toutes les variantes de cette commande
      const variantsQuery = query(
        collection(db, 'variants-ordered-v2'),
        where('orderId', '==', encodedOrderId)
      );
      
      const variantsSnapshot = await getDocs(variantsQuery);
      
      console.log('Nombre de checkboxes à supprimer:', variantsSnapshot.size);
      
      // Supprimer toutes les variantes
      const deletePromises = variantsSnapshot.docs.map(docSnap => {
        return deleteDoc(docSnap.ref);
      });
      
      await Promise.all(deletePromises);
      
      // Remettre le comptage à zéro
      await setDoc(doc(db, 'textile-progress-v2', encodedOrderId), {
        totalCount: 0,
        checkedCount: 0,
        updatedAt: new Date().toISOString()
      });
      
      console.log('Toutes les checkboxes ont été supprimées');
      
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

  const checkAllCheckboxes = async () => {
    if (!currentOrder) return;

    setIsCheckingAll(true);
    try {
      const encodedOrderId = encodeFirestoreId(currentOrder.id);
      
      console.log('=== COCHAGE DE TOUTES LES CHECKBOXES ===');
      console.log('Order ID:', currentOrder.id);
      
      let totalChecked = 0;
      
      // Pour chaque article non annulé, créer/cocher toutes les checkboxes
      const promises = currentOrder.lineItems?.flatMap((item, index) => {
        if (item.isCancelled) return [];
        
        const color = getColorFromVariant(item);
        const size = getSizeFromVariant(item);
        const selectedOptions = getSelectedOptions(item);
        
        // Créer une checkbox pour chaque quantité
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
      
      // Calculer le total (articles non annulés)
      const totalCount = currentOrder.lineItems?.reduce((sum, item) => {
        return sum + (item.isCancelled ? 0 : item.quantity);
      }, 0) || 0;
      
      // Mettre à jour le comptage
      await setDoc(doc(db, 'textile-progress-v2', encodedOrderId), {
        totalCount,
        checkedCount: totalChecked,
        updatedAt: new Date().toISOString()
      });
      
      console.log('Toutes les checkboxes ont été cochées:', totalChecked);
      
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
              <>
                <Group justify="flex-end">
                  <Button
                    leftSection={<IconTrash size={16} />}
                    variant="light"
                    color="red"
                    onClick={deleteAllCheckboxes}
                    loading={isDeleting}
                  >
                    Supprimer toutes les checkboxes
                  </Button>
                  <Button
                    leftSection={<IconCheck size={16} />}
                    variant="light"
                    color="green"
                    onClick={checkAllCheckboxes}
                    loading={isCheckingAll}
                  >
                    Cocher toutes les cases
                  </Button>
                  <Button
                    leftSection={<IconRefresh size={16} />}
                    variant="light"
                    color="blue"
                    onClick={recalculateCheckboxCount}
                    loading={isRecalculating}
                  >
                    Recalculer le comptage
                  </Button>
                </Group>
                <div className={styles.ordersGrid}>
                  <OrderRow
                    order={currentOrder}
                    isSelected={false}
                    onSelect={onSelectOrder}
                  />
                </div>
              </>
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
