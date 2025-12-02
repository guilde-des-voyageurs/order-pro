'use client';

import { useEffect, useState, useMemo } from 'react';
import { Title, Paper, Stack, Table, Text, Group, Box, Select, NumberInput } from '@mantine/core';
import { CalculateCostButton } from '@/components/CalculateCostButton';
import { OrderTotalCell } from '@/components/OrderTotalCell';
import { HandlingFeeCell } from '@/components/HandlingFeeCell';
import { usePriceRules } from '@/hooks/usePriceRules';
import { CostRow } from '@/components/CostRow';
import { HANDLING_FEE } from '@/config/billing';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/db';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { VariantCheckboxGroup } from '@/components/VariantCheckboxGroup';
import { OrderCheckboxSummary } from '@/components/OrderCheckboxSummary';
import styles from './facturation-v2.module.scss';
import { encodeFirestoreId } from '@/utils/firebase-helpers';
import { InvoiceCheckbox } from '@/components/InvoiceCheckbox/InvoiceCheckbox';
import { MonthlyInvoiceButton } from '@/components/MonthlyInvoiceButton';
import { useMonthlyBalance } from '@/hooks/useMonthlyBalance';
import { OrderBalanceCell } from '@/components/OrderBalanceCell';
import { MonthlyBillingNote } from '@/components/MonthlyBillingNote';
import { useDragScroll } from '@/hooks/useDragScroll';
import { getColorFromVariant, getSizeFromVariant } from '@/utils/variant-helpers';

interface Order {
  id: string;
  name: string;
  createdAt: string;
  displayFinancialStatus?: string;
  tags?: string[];
  lineItems: Array<{
    title: string;
    quantity: number;
    sku: string;
    variantTitle?: string;
    variant?: {
      metafields?: Array<{
        namespace: string;
        key: string;
        value: string;
      }>;
    };
  }>;
}

export default function FacturationV2Page() {
  const queryClient = useQueryClient();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const { rules } = usePriceRules();
  const { balance, updateBalance } = useMonthlyBalance(selectedMonth);
  const scrollRef = useDragScroll<HTMLDivElement>();

  useEffect(() => {
    // Créer la requête pour les commandes
    const ordersQuery = query(
      collection(db, 'orders-v2'),
      orderBy('createdAt', 'desc')
    );

    // Souscrire aux changements
    const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
      const filteredOrders = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Order))
        .filter(order => 
          // Filtrer les commandes remboursées
          order.displayFinancialStatus !== 'REFUNDED' &&
          // Filtrer les commandes batch
          !order.tags?.some(tag => tag.toLowerCase().includes('batch'))
        );
      
      setOrders(filteredOrders);
    });

    return () => unsubscribe();
  }, []);

  const formatDate = (date: string) => {
    return format(new Date(date), 'dd/MM/yyyy', { locale: fr });
  };

  const formatVariant = (variantTitle?: string) => {
    if (!variantTitle) return '';
    // Supporter N niveaux de variantes (couleur, taille, matière, etc.)
    return variantTitle.split(' / ').join(' - ');
  };

  // Grouper les commandes par mois
  const ordersByMonth = orders.reduce<Record<string, Order[]>>((acc, order) => {
    const date = new Date(order.createdAt);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!acc[monthKey]) acc[monthKey] = [];
    acc[monthKey].push(order);
    return acc;
  }, {});

  // Extraire la liste des mois disponibles
  const availableMonths = [...new Set(orders.map(order => {
    const date = new Date(order.createdAt);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }))].sort().reverse();

  const monthOptions = availableMonths.map(monthKey => {
    const [year, month] = monthKey.split('-');
    const monthTitle = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('fr-FR', {
      month: 'long',
      year: 'numeric'
    });
    return { value: monthKey, label: monthTitle };
  });

  return (
    <div className={styles.container}>
      <Group grow mb="xl">
        <Select
          label="Mois"
          placeholder="Sélectionnez un mois"
          data={monthOptions}
          value={selectedMonth}
          onChange={(value) => setSelectedMonth(value || '')}
          w={300}
        />
        <NumberInput
          label="Balance (€ HT)"
          placeholder="0"
          decimalScale={2}
          fixedDecimalScale
          allowNegative
          value={balance}
          onChange={(value) => updateBalance(typeof value === 'string' ? parseFloat(value) : value || 0)}
        />
      </Group>
      <div className={styles.tableContainer}>
        {Object.entries(ordersByMonth)
          .filter(([monthKey]) => monthKey === selectedMonth)
          .map(([monthKey, monthOrders]) => {
            const [year, month] = monthKey.split('-');
            const monthTitle = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('fr-FR', {
              month: 'long',
              year: 'numeric'
            });

            return (
              <Paper key={monthKey} mb="md" style={{ overflow: 'visible' }}>
                <Group justify="space-between" mb="md">
                  <Box>
                    <Title order={3} mb="sm">{monthTitle}</Title>
                    <MonthlyBillingNote monthKey={monthKey} />
                  </Box>
                  <MonthlyInvoiceButton orders={monthOrders} monthId={selectedMonth} />
                </Group>
                <div ref={scrollRef} style={{ maxWidth: '80vw', overflowX: 'auto' }}>
                <Table.ScrollContainer minWidth={800} type="native">
                  <Table striped highlightOnHover style={{ width: 'auto', tableLayout: 'auto' }}>
                    <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Date</Table.Th>
                      <Table.Th>Commande</Table.Th>
                      <Table.Th>Contenu</Table.Th>
                      <Table.Th>Décompte</Table.Th>
                      <Table.Th>Coût</Table.Th>
                      <Table.Th>Manutention</Table.Th>
                      <Table.Th>Balance (€ HT)</Table.Th>
                      <Table.Th>Total</Table.Th>
                      <Table.Th>Facturé</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {monthOrders.map((order) => (
                      <Table.Tr key={order.id}>
                        <Table.Td>{format(new Date(order.createdAt), 'dd/MM/yyyy', { locale: fr })}</Table.Td>
                        <Table.Td>{order.name}</Table.Td>
                        <Table.Td style={{ width: 'auto', whiteSpace: 'nowrap', padding: '0.5rem', textAlign: 'left' }}>
                          <Stack gap="xs" align="flex-start">
                            {order.lineItems.map((item, index) => {
                              const color = getColorFromVariant(item);
                              const size = getSizeFromVariant(item);
                              return (
                                <Group key={index} gap="xs" wrap="nowrap" align="center" style={{ width: '100%' }}>
                                  <VariantCheckboxGroup
                                    orderId={encodeFirestoreId(order.id)}
                                    sku={item.sku || ''}
                                    color={color}
                                    size={size}
                                    quantity={item.quantity}
                                    productIndex={index}
                                    variantTitle={item.variantTitle}
                                    lineItems={order.lineItems.map(item => ({
                                      sku: item.sku || '',
                                      variantTitle: item.variantTitle,
                                      quantity: item.quantity
                                    }))}  
                                  />
                                  <Text size="sm" style={{ margin: 0, fontSize: '0.7rem', textAlign: 'left' }}>
                                    {item.quantity}x {item.sku} - {formatVariant(item.variantTitle)} ({item.title})
                                  </Text>
                                </Group>
                              );
                            })}
                          </Stack>
                        </Table.Td>
                        <Table.Td style={{ width: 'auto', padding: '0.5rem', textAlign: 'center' }}>
                          <OrderCheckboxSummary
                            orderId={encodeFirestoreId(order.id)}
                            lineItems={order.lineItems.map(item => ({
                              sku: item.sku || '',
                              variantTitle: item.variantTitle,
                              quantity: item.quantity
                            }))}
                          />
                        </Table.Td>
                        <Table.Td style={{ maxWidth: '200px', whiteSpace: 'normal', wordWrap: 'break-word', fontSize: '0.7rem' }}>
                          <Stack gap="xs">
                            {order.lineItems.map((item, index) => (
                              <CostRow
                                key={index}
                                orderId={encodeFirestoreId(order.id)}
                                item={item}
                                index={index}
                                rules={rules}
                              />
                            ))}
                          </Stack>
                        </Table.Td>
                        <Table.Td>
                          <HandlingFeeCell
                            orderId={encodeFirestoreId(order.id)}
                            lineItems={order.lineItems}
                          />
                        </Table.Td>
                        <Table.Td style={{ maxWidth: '80px' }}>
                          <OrderBalanceCell orderId={order.id} />
                        </Table.Td>
                        <Table.Td>
                          <OrderTotalCell orderId={encodeFirestoreId(order.id)} />
                        </Table.Td>
                        <Table.Td>
                          <CalculateCostButton
                            orderId={encodeFirestoreId(order.id)}
                            lineItems={order.lineItems}
                            rules={rules}
                          />
                        </Table.Td>
                        <Table.Td>
                          <InvoiceCheckbox orderId={order.id} />
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
                </Table.ScrollContainer>
                </div>
              </Paper>
            );
          })}
      </div>
    </div>
  );
}
