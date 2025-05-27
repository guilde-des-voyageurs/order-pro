'use client';

// External dependencies
import { Title, Text, Loader, Table, Group, Stack, Paper, Badge, Select } from '@mantine/core';
import { IconMessage, IconAlertTriangle } from '@tabler/icons-react';
import { useState } from 'react';

// Internal dependencies
import { useStockInvoicesPresenter } from './StockInvoicesPage.presenter';
import { OrderDrawer } from '@/components/OrderDrawer/OrderDrawer';
import { useInvoiceStatus } from '@/components/InvoiceCheckbox/InvoiceCheckbox';
import { TextileProgress } from '@/components/TextileProgress/TextileProgress';
import { DaysElapsed } from '@/components/DaysElapsed/DaysElapsed';
import { VariantCheckbox } from '@/components/VariantCheckbox';
import { BillingNoteInput } from '@/components/BillingNoteInput/BillingNoteInput';

// Hooks
import { calculateItemPrice, PriceRule } from '@/hooks/usePriceRules';

// Utils
import { encodeFirestoreId } from '@/utils/firebase-helpers';
import { generateVariantId } from '@/utils/variant-helpers';

// Types
import type { ShopifyOrder } from '@/types/shopify';

// Styles
import styles from './StockInvoicesPage.module.scss';

interface OrderOptionType {
  value: string;
  label: string;
  order: ShopifyOrder;
}

// Helpers
function formatItemString(item: NonNullable<ShopifyOrder['lineItems']>[number]) {
  const sku = item.sku || '';
  const [color, size] = (item.variantTitle || '').split(' / ');
  return `${sku} - ${color || ''} - ${size || ''}`;
}

export function StockInvoicesPage() {
  const { 
    isLoading,
    pendingOrders: orders,
    selectedOrder,
    onSelectOrder,
    onCloseDrawer,
    isDrawerOpen,
    orderStats
  } = useStockInvoicesPresenter();

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const currentOrder = orders.find(o => o.id === selectedOrderId);

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <Loader />
      </div>
    );
  }

  const orderOptions: OrderOptionType[] = orders.map(order => ({
    value: order.id,
    label: order.name,
    order: order
  }));

  return (
    <div className={styles.container}>
      <Stack gap="xl">
        <div className={styles.header}>
          <Title order={2}>Facturation Stock</Title>
          <Group gap="xs">
            <Badge size="lg" variant="light" color="yellow">
              <Group gap="xs">
                <IconAlertTriangle size={16} />
                {orderStats.old} commandes &gt; 14 jours
              </Group>
            </Badge>
            <Badge size="lg" variant="light" color="orange">
              <Group gap="xs">
                <IconMessage size={16} />
                {orderStats.medium} commandes &gt; 7 jours
              </Group>
            </Badge>
          </Group>
        </div>

        <Paper p="md" withBorder>
          <Stack gap="md">
            <Select
              label="Sélectionner une commande batch"
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
              <Paper withBorder p="md">
                <Stack gap="md">
                  <Group justify="space-between">
                    <Text fw={500} size="lg">{currentOrder.name}</Text>
                    <BillingNoteInput orderId={currentOrder.id} />
                  </Group>

                  <Table>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Article</Table.Th>
                        <Table.Th>Quantité</Table.Th>
                        <Table.Th>Prix</Table.Th>
                        <Table.Th>Textile</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {currentOrder.lineItems?.map((item, index) => {
                        const [color, size] = (item.variantTitle || '').split(' / ');
                        return (
                          <Table.Tr key={index}>
                            <Table.Td>{formatItemString(item)}</Table.Td>
                            <Table.Td>{item.quantity}</Table.Td>
                            <Table.Td>
                              {calculateItemPrice(formatItemString(item), [])}
                            </Table.Td>
                            <Table.Td>
                              <Group gap="xs">
                                {Array.from({ length: item.quantity }).map((_, quantityIndex) => (
                                  <VariantCheckbox
                                    key={quantityIndex}
                                    orderId={currentOrder.id}
                                    sku={item.sku || ''}
                                    color={color || ''}
                                    size={size || ''}
                                    quantity={1}
                                    productIndex={index}
                                    quantityIndex={quantityIndex}
                                    variantId={generateVariantId(
                                      encodeFirestoreId(currentOrder.id),
                                      item.sku || '',
                                      color || '',
                                      size || '',
                                      index,
                                      quantityIndex
                                    )}
                                  />
                                ))}
                              </Group>
                            </Table.Td>
                          </Table.Tr>
                        );
                      })}
                    </Table.Tbody>
                  </Table>
                </Stack>
              </Paper>
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
