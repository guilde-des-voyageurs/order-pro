'use client';

import { useEffect, useState } from 'react';
import { Title, Paper, Table, Text, Stack, Group, Badge } from '@mantine/core';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/config';
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
              <Table.Th>Numéro</Table.Th>
              <Table.Th>Contenu</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {orders.map((order) => (
              <Table.Tr key={order.id}>
                <Table.Td>{formatDate(order.createdAt)}</Table.Td>
                <Table.Td>{order.name}</Table.Td>
                <Table.Td>
                  <Stack gap="xs">
                    {order.lineItems.map((item, index) => {
                      const [color, size] = (item.variantTitle || '').split(' / ');
                      return (
                        <Group key={index} gap="md" wrap="nowrap" align="center">
                          <Group gap="xs" w={400} wrap="nowrap">
                            <Text size="sm">{item.quantity}x {item.sku} - {formatVariant(item.variantTitle)}</Text>
                            {(item.variant?.metafields?.find(m => m.namespace === 'custom' && m.key === 'fichier_d_impression') || 
                              item.variant?.metafields?.find(m => m.namespace === 'custom' && m.key === 'verso_impression')) && (
                              <Group gap={4}>
                                {item.variant?.metafields?.find(m => m.namespace === 'custom' && m.key === 'fichier_d_impression') && (
                                  <Badge
                                    variant="light" 
                                    color="gray"
                                    size="sm"
                                  >
                                    {item.variant.metafields.find(m => m.key === 'fichier_d_impression')?.value}
                                  </Badge>
                                )}
                                {item.variant?.metafields?.find(m => m.namespace === 'custom' && m.key === 'verso_impression') && (
                                  <Badge
                                    variant="light" 
                                    color="gray"
                                    size="sm"
                                  >
                                    {item.variant.metafields.find(m => m.key === 'verso_impression')?.value}
                                  </Badge>
                                )}
                              </Group>
                            )}
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
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Paper>
    </div>
  );
}
