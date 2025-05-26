'use client';

import { useEffect, useState } from 'react';
import { Title, Paper, Table, Text, Stack, Group } from '@mantine/core';
import { CalculateCostButton } from '@/components/CalculateCostButton';
import { OrderTotalCell } from '@/components/OrderTotalCell';
import { HandlingFeeCell } from '@/components/HandlingFeeCell';
import { InvoiceStatusCheckbox } from '@/components/InvoiceStatusCheckbox';
import { usePriceRules } from '@/hooks/usePriceRules';
import { CostRow } from '@/components/CostRow';
import { HANDLING_FEE } from '@/config/billing';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/db';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { VariantCheckboxGroup } from '@/components/VariantCheckboxGroup';
import styles from './facturation-v2.module.scss';
import { encodeFirestoreId } from '@/utils/firebase-helpers';

interface Order {
  id: string;
  name: string;
  createdAt: string;
  displayFinancialStatus?: string;
  tags?: string[];
  lineItems: Array<{
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
  const [orders, setOrders] = useState<Order[]>([]);
  const { rules } = usePriceRules();

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
    const [color, size] = variantTitle.split(' / ');
    return `${color} - ${size}`;
  };

  return (
    <div className={styles.container}>
      <Title order={2} mb="md">Facturation V2</Title>
      <Paper p="md" radius="sm" className={styles.tableContainer}>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Date</Table.Th>
              <Table.Th>Commande</Table.Th>
              <Table.Th>Contenu</Table.Th>
              <Table.Th>Coût</Table.Th>
              <Table.Th>Manutention</Table.Th>
              <Table.Th>Total</Table.Th>
              <Table.Th>Actions</Table.Th>
              <Table.Th>Facturé</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {orders.map((order) => (
              <Table.Tr key={order.id}>
                <Table.Td>{format(new Date(order.createdAt), 'dd/MM/yyyy', { locale: fr })}</Table.Td>
                <Table.Td>{order.name}</Table.Td>
                <Table.Td>
                  <Stack gap="xs">
                    {order.lineItems.map((item, index) => {
                      const [color, size] = (item.variantTitle || '').split(' / ');
                      return (
                        <Group key={index} gap="md" wrap="nowrap" align="center">
                          <Group gap="xs" wrap="nowrap">
                            <Text size="sm">{item.quantity}x {item.sku} - {formatVariant(item.variantTitle)}</Text>
                          </Group>
                          <VariantCheckboxGroup
                            orderId={encodeFirestoreId(order.id)}
                            sku={item.sku || ''}
                            color={color || ''}
                            size={size || ''}
                            quantity={item.quantity}
                            productIndex={index}
                            lineItems={order.lineItems.map(item => ({
                              sku: item.sku || '',
                              variantTitle: item.variantTitle,
                              quantity: item.quantity
                            }))}  
                          />
                        </Group>
                      );
                    })}
                  </Stack>
                </Table.Td>
                <Table.Td>
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
                  <InvoiceStatusCheckbox orderId={encodeFirestoreId(order.id)} />
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Paper>
    </div>
  );
}
