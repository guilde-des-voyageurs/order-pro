'use client';

import { useEffect, useState } from 'react';
import { Title, Paper, Stack, Table, Text, Group, Box, Select, Button } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { BatchCalculator } from '@/components/BatchCalculator/BatchCalculator';
import { CostRow } from '@/components/CostRow';
import { collection, query, orderBy, onSnapshot, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/db';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { VariantCheckboxGroup } from '@/components/VariantCheckboxGroup';
import styles from './facturation-v2-batch.module.scss';
import { encodeFirestoreId } from '@/utils/firebase-helpers';
import { BatchBillingNote } from '@/components/BatchBillingNote';
import { BatchBalance } from '@/components/BatchBalance';
import { LineItemBalance } from '@/components/LineItemBalance/LineItemBalance';
import { usePriceRules } from '@/hooks/usePriceRules';

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

export default function FacturationV2BatchPage() {
  const [calculatedTotal, setCalculatedTotal] = useState<number | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');

  const { rules } = usePriceRules();

  // Fonction de tri des commandes par numéro (ordre décroissant)
  const sortOrdersByNumber = (orders: Order[]) => {
    return [...orders].sort((a, b) => {
      const aNumber = parseInt(a.name.replace('#', ''));
      const bNumber = parseInt(b.name.replace('#', ''));
      return bNumber - aNumber;
    });
  };

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
          // Ne garder que les commandes batch
          order.tags?.some(tag => tag.toLowerCase().includes('batch'))
        );
      
      setOrders(filteredOrders);
    });

    return () => unsubscribe();
  }, []);

  // Sélectionner la commande la plus récente par défaut
  useEffect(() => {
    if (orders.length > 0) {
      const sortedOrders = sortOrdersByNumber(orders);
      setSelectedOrderId(sortedOrders[0].id);
    }
  }, [orders]);

  const formatDate = (date: string) => {
    return format(new Date(date), 'dd/MM/yyyy', { locale: fr });
  };

  const formatVariant = (variantTitle?: string) => {
    if (!variantTitle) return '';
    // Supporter N niveaux de variantes (couleur, taille, matière, etc.)
    return variantTitle.split(' / ').join(' - ');
  };

  // Trier les commandes par numéro de commande
  const sortedOrders = sortOrdersByNumber(orders);

  // Préparer les options pour le select
  const orderOptions = sortedOrders.map(order => ({
    value: order.id,
    label: `${order.name} - ${format(new Date(order.createdAt), 'dd/MM/yyyy', { locale: fr })}`
  }));

  // Filtrer les commandes selon la sélection
  const displayedOrders = selectedOrderId ? sortedOrders.filter(order => order.id === selectedOrderId) : sortedOrders;

  return (
    <div className={styles.container}>
      <Group align="flex-end" mb="xl" justify="space-between">
        <Stack gap="xs">
          <Select
            label="Sélectionner une commande"
            placeholder="Choisir une commande"
            data={orders.map((order) => ({
              value: order.id,
              label: `${order.name} - ${format(new Date(order.createdAt), 'dd MMMM yyyy', { locale: fr })}`
            }))}
            value={selectedOrderId}
            onChange={(value) => {
              setSelectedOrderId(value || '');
              setCalculatedTotal(null);
            }}
            searchable
          />
          {calculatedTotal !== null && (
            <Text size="lg" fw={700} ta="right">
              Total facturé : {calculatedTotal.toFixed(2)} €
            </Text>
          )}
        </Stack>
        <Group gap="md">
          <Box w={400}>
            <BatchBillingNote orderId={selectedOrderId.replace(/[\/:]/g, '_')} />
          </Box>
          <BatchBalance orderId={selectedOrderId.replace(/[\/:]/g, '_')} />
        </Group>
      </Group>
      <Paper p="md" radius="sm" className={styles.tableContainer}>
        <Group justify="space-between" mb="lg">
          <Title order={1}>Facturation textile par lot</Title>
          {selectedOrderId && (
            <BatchCalculator
              orderId={selectedOrderId}
              lineItems={orders.find(o => o.id === selectedOrderId)?.lineItems || []}
              rules={rules || []}
              onCalculated={setCalculatedTotal}
            />
          )}
        </Group>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Contenu</Table.Th>
              <Table.Th>Prix</Table.Th>
              <Table.Th>Balance</Table.Th>

            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {displayedOrders.flatMap((order) =>
              order.lineItems.map((item, index) => (
                <Table.Tr key={`${order.id}-${index}`}>
                  <Table.Td>
                    <Group gap="xs" wrap="nowrap">
                      <Text size="sm">{item.quantity}x {item.sku} - {formatVariant(item.variantTitle)}</Text>
                      <VariantCheckboxGroup
                        orderId={encodeFirestoreId(order.id)}
                        sku={item.sku || ''}
                        color={(item.variantTitle || '').split(' / ')[0] || ''}
                        size={(item.variantTitle || '').split(' / ')[1] || ''}
                        quantity={item.quantity}
                        productIndex={index}
                        lineItems={order.lineItems.map(item => ({
                          sku: item.sku || '',
                          variantTitle: item.variantTitle,
                          quantity: item.quantity
                        }))}
                      />
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <CostRow
                      orderId={encodeFirestoreId(order.id)}
                      item={item}
                      index={index}
                      rules={rules}
                    />
                  </Table.Td>
                  <Table.Td>
                    <LineItemBalance
                      orderId={order.id}
                      sku={item.sku}
                      total={(rules?.find(rule => rule.searchString === item.sku)?.price || 0) * item.quantity}
                    />
                  </Table.Td>

                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>
      </Paper>
    </div>
  );
}
