'use client';

import { useEffect, useState } from 'react';
import { Title, Paper, Table, Stack, Group, Text, UnstyledButton } from '@mantine/core';
import styles from './facturation.module.scss';
import { db } from '@/firebase/config';
import { collection, query, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';
import { BillingCheckbox } from '@/components/BillingCheckbox';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { fr } from 'date-fns/locale';
import { WeeklyBillingCheckbox } from '@/components/WeeklyBillingCheckbox';
import { WeeklyBillingNote } from '@/components/WeeklyBillingNote';
import { OrderDrawer } from '@/components/OrderDrawer/OrderDrawer';
import { ShopifyOrder } from '@/types/shopify';
import { encodeFirestoreId } from '@/utils/firebase-helpers';

interface Order {
  id: string;
  name: string;  // Le numéro de commande
  createdAt: string;
  lineItems: Array<{
    quantity: number;
    unitCost?: number | null;
    totalCost?: number | null;
  }>;
}

interface WeeklyOrders {
  weekStart: Date;
  weekEnd: Date;
  orders: Order[];
}

export default function FacturationPage() {
  const [weeklyOrders, setWeeklyOrders] = useState<WeeklyOrders[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<ShopifyOrder | undefined>(undefined);
  const [drawerOpened, setDrawerOpened] = useState(false);
  const [loading, setLoading] = useState(true);

  const handleOrderClick = async (orderId: string) => {
    try {
      const encodedId = encodeFirestoreId(orderId);
      const orderRef = doc(db, 'orders-v2', encodedId);
      const orderDoc = await getDoc(orderRef);
      
      if (orderDoc.exists()) {
        const orderData = orderDoc.data() as ShopifyOrder;
        setSelectedOrder(orderData);
        setDrawerOpened(true);
      }
    } catch (error) {
      console.error('Error fetching order:', error);
    }
  };

  const handleDrawerClose = () => {
    setDrawerOpened(false);
    setSelectedOrder(undefined);
  };

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const ordersRef = collection(db, 'orders-v2');
        const q = query(ordersRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        
        const orders = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Order[];

        // Grouper les commandes par semaine
        const groupedOrders = orders.reduce((acc: WeeklyOrders[], order) => {
          const orderDate = new Date(order.createdAt);
          const weekStart = startOfWeek(orderDate, { weekStartsOn: 1 }); // Semaine commence le lundi
          const weekEnd = endOfWeek(orderDate, { weekStartsOn: 1 });

          const existingWeek = acc.find(
            week => week.weekStart.getTime() === weekStart.getTime()
          );

          if (existingWeek) {
            existingWeek.orders.push(order);
          } else {
            acc.push({
              weekStart,
              weekEnd,
              orders: [order]
            });
          }

          return acc;
        }, []);

        setWeeklyOrders(groupedOrders);
      } catch (error) {
        console.error('Erreur lors de la récupération des commandes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const getProductCount = (order: Order) => {
    return order.lineItems.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalCost = (order: Order) => {
    return order.lineItems.reduce((total, item) => {
      // Si totalCost est disponible, l'utiliser
      if (item.totalCost) {
        return total + item.totalCost;
      }
      // Sinon calculer avec unitCost * quantity
      else if (item.unitCost) {
        return total + (item.quantity * item.unitCost);
      }
      return total;
    }, 0);
  };

  const formatWeekRange = (start: Date, end: Date) => {
    return `${format(start, 'dd/MM/yyyy', { locale: fr })} - ${format(end, 'dd/MM/yyyy', { locale: fr })}`;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(price);
  };

  if (loading) {
    return <div>Chargement...</div>;
  }

  return (
    <div className={styles.container}>
      <Title className={styles.title}>Facturation</Title>

      <Stack gap="xl">
        {weeklyOrders.map((week) => (
          <div key={week.weekStart.toISOString()}>
            <Title order={3} className={styles.weekTitle}>
              {formatWeekRange(week.weekStart, week.weekEnd)}
              <WeeklyBillingCheckbox 
                orderIds={week.orders.map(order => `gid://shopify/Order/${order.id}`)}
              />
            </Title>
            
            <Paper withBorder p="md">
              <Stack gap="md">
                <WeeklyBillingNote weekStart={week.weekStart} />
                
                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Commande</Table.Th>
                      <Table.Th>Nombre de produits</Table.Th>
                      <Table.Th>Facturation</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {week.orders.map((order) => (
                      <Table.Tr key={order.id}>
                        <Table.Td>
                          <UnstyledButton 
                            onClick={() => handleOrderClick(`gid://shopify/Order/${order.id}`)}
                            className={styles.orderLink}
                          >
                            {order.name}
                          </UnstyledButton>
                        </Table.Td>
                        <Table.Td>{getProductCount(order)}</Table.Td>
                        <Table.Td>
                          <Group gap="md">
                            <BillingCheckbox 
                              orderId={`gid://shopify/Order/${order.id}`}
                            />
                            <Text size="sm" c="dimmed">
                              {formatPrice(getTotalCost(order))}
                            </Text>
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                    <Table.Tr className={styles.totalRow}>
                      <Table.Td colSpan={2} style={{ textAlign: 'right' }}>
                        <Text fw={500}>Total de la semaine :</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text fw={500} size="lg" c="blue">
                          {formatPrice(week.orders.reduce((total, order) => total + getTotalCost(order), 0))}
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  </Table.Tbody>
                </Table>
              </Stack>
            </Paper>
          </div>
        ))}
      </Stack>

      <OrderDrawer
        order={selectedOrder}
        onClose={handleDrawerClose}
        opened={drawerOpened}
      />
    </div>
  );
};
