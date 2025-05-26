'use client';

import { useEffect, useState } from 'react';
import { Title, Paper, Table, Stack, Group, Text, UnstyledButton, Badge } from '@mantine/core';
import { HANDLING_FEE } from '@/config/billing';
import { usePriceRules, calculateItemPrice } from '@/hooks/usePriceRules';
import { VariantCheckbox } from '@/components/VariantCheckbox';
import { transformColor } from '@/utils/color-transformer';
import { useCheckedVariants } from '@/hooks/useCheckedVariants';
import styles from './facturation.module.scss';
import { collection, query, orderBy, getDocs, doc, getDoc, where } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { BillingCheckbox } from '@/components/BillingCheckbox';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { fr } from 'date-fns/locale';
import { WeeklyBillingCheckbox } from '@/components/WeeklyBillingCheckbox';
import { WeeklyBillingNote } from '@/components/WeeklyBillingNote';
import { OrderDrawer } from '@/components/OrderDrawer/OrderDrawer';
import { ShopifyOrder } from '@/types/shopify';
import { encodeFirestoreId } from '@/utils/firebase-helpers';
import { calculateOrderTotal } from '@/utils/order-total';

interface VariantCheckboxesProps {
  orderId: string;
  sku: string;
  color: string;
  size: string;
  itemIndex: number;
  quantity: number;
  printFile?: string;
  versoFile?: string;
}

function formatItemString(item: Order['lineItems'][0]) {
  // SKU
  const sku = item.sku || '';

  // Transformer la couleur et la taille
  const [color, size] = (item.variantTitle || '').split(' / ');
  const cleanedColor = color?.replace(/\s*\([^)]*\)\s*/g, '').trim() || '';
  const transformedColor = transformColor(cleanedColor);

  // Fichier d'impression
  const printFile = item.variant?.metafields?.find(
    m => m.namespace === 'custom' && m.key === 'fichier_d_impression'
  )?.value || '';

  // Verso impression
  const versoFile = item.variant?.metafields?.find(
    m => m.namespace === 'custom' && m.key === 'verso_impression'
  )?.value || '';

  // Construire la chaîne finale
  const parts = [sku, transformedColor, size, printFile, versoFile].filter(Boolean);
  return parts.join(' - ');
}

function VariantCheckboxes({ orderId, sku, color, size, itemIndex, quantity, printFile, versoFile }: VariantCheckboxesProps) {
  const { rules } = usePriceRules();
  const checkedCount = useCheckedVariants({
    orderId,
    sku,
    color,
    size,
    index: itemIndex,      // productIndex
    lineItemIndex: 0,      // quantityIndex (0 car c'est le premier)
    quantity
  });

  return (
    <Stack gap="xs">
      <Badge size="sm" variant="light" color="blue">
        {checkedCount}/{quantity} cochées
      </Badge>
      {checkedCount > 0 && (
        <Group gap={4}>
          <Text size="sm" fw={500}>
            {Number(calculateItemPrice(formatItemString({
              sku,
              variantTitle: `${color} / ${size}`,
              variant: {
                metafields: [
                  ...(printFile ? [{ namespace: 'custom', key: 'fichier_d_impression', value: printFile }] : []),
                  ...(versoFile ? [{ namespace: 'custom', key: 'verso_impression', value: versoFile }] : [])
                ]
              },
              quantity: 1
            }), rules)).toFixed(2)}€ HT
          </Text>
          <Text size="sm" c="dimmed">
            x {checkedCount}
          </Text>
          <Text size="sm" fw={500}>
            = {(Number(calculateItemPrice(formatItemString({
              sku,
              variantTitle: `${color} / ${size}`,
              variant: {
                metafields: [
                  ...(printFile ? [{ namespace: 'custom', key: 'fichier_d_impression', value: printFile }] : []),
                  ...(versoFile ? [{ namespace: 'custom', key: 'verso_impression', value: versoFile }] : [])
                ]
              },
              quantity: 1
            }), rules)) * checkedCount).toFixed(2)}€ HT
          </Text>
        </Group>
      )}
    </Stack>
  );
}

interface Order {
  id: string;
  name: string;  // Le numéro de commande
  createdAt: string;
  displayFinancialStatus?: string;
  tags?: string[];
  lineItems: Array<{
    quantity: number;
    unitCost?: number | null;
    totalCost?: number | null;
    sku?: string;
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

interface WeeklyOrders {
  weekStart: Date;
  weekEnd: Date;
  orders: Order[];
}

const getVariantTotal = (item: Order['lineItems'][0], rules: any, checkedCount: number) => {
  const price = Number(calculateItemPrice(formatItemString({
    sku: item.sku || '',
    variantTitle: item.variantTitle,
    variant: item.variant,
    quantity: 1
  }), rules));

  return price * checkedCount;
}

interface WeekTotalProps {
  orders: Order[];
}

function WeekTotal({ orders }: WeekTotalProps) {
  const [weekTotal, setWeekTotal] = useState(0);
  const { rules } = usePriceRules();

  useEffect(() => {
    const calculateTotal = async () => {
      let total = 0;
      for (const order of orders) {
        let orderVariantsTotal = 0;

        total += await calculateOrderTotal(order, rules);
      }
      setWeekTotal(total);
    };

    calculateTotal();
  }, [orders, rules]);

  return (
    <Text fw={500} size="lg" c="blue">
      Total semaine : {weekTotal.toFixed(2)}€ HT
    </Text>
  );
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
        const q = query(
          ordersRef, 
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        
        const orders = querySnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          } as Order))
          .filter(order => {
            // Exclure les commandes remboursées ou annulées
            const status = order.displayFinancialStatus?.toLowerCase();
            if (status === 'refunded' || status === 'canceled') {
              return false;
            }

            // Exclure les commandes qui ont un tag contenant batch
            if (order.tags?.some(tag => tag.toLowerCase().includes('batch'))) {
              return false;
            }

            return true;
          });

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

  interface OrderTotalProps {
    order: Order;
  }

  function OrderTotal({ order }: OrderTotalProps) {
    const [total, setTotal] = useState(0);
    const { rules } = usePriceRules();

    useEffect(() => {
      const calculateTotal = async () => {
        const orderTotal = await calculateOrderTotal(order, rules);
        setTotal(orderTotal);
      };

      calculateTotal();
    }, [order, rules]);

    return (
      <Text size="sm" fw={500}>
        {total.toFixed(2)}€ HT
      </Text>
    );
  }

  const formatWeekRange = (start: Date, end: Date) => {
    return `${format(start, 'dd/MM/yyyy', { locale: fr })} - ${format(end, 'dd/MM/yyyy', { locale: fr })}`;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(price);
  };

  function ManutentionCell({ order }: OrderTotalProps) {
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { rules } = usePriceRules();

    useEffect(() => {
      let isMounted = true;

      const calculateTotal = async () => {
        try {
          setIsLoading(true);
          setError(null);
          const orderTotal = await calculateOrderTotal(order, rules);
          if (isMounted) {
            setTotal(orderTotal);
          }
        } catch (err) {
          if (isMounted) {
            console.error('Error calculating total:', err);
            setError('Erreur de calcul du total');
          }
        } finally {
          if (isMounted) {
            setIsLoading(false);
          }
        }
      };

      calculateTotal();
      return () => { isMounted = false; };
    }, [order, rules]);

    if (isLoading) {
      return <Text size="sm" color="dimmed">Calcul en cours...</Text>;
    }

    if (error) {
      return <Text size="sm" color="red">{error}</Text>;
    }

    if (total > 0) {
      return (
        <Text size="sm">
          {HANDLING_FEE.toFixed(2)}€ HT
        </Text>
      );
    }

    return null;
  }

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
                      <Table.Th>Détails</Table.Th>
                      <Table.Th>Manutention HT</Table.Th>
                      <Table.Th>Facturation HT</Table.Th>
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
                        <Table.Td>
                          <Stack gap="md">
                            {order.lineItems.map((item, itemIndex) => {
                              const [color, size] = (item.variantTitle || '').split(' / ');
                              const cleanedColor = color?.replace(/\s*\([^)]*\)\s*/g, '').trim() || '';
                              const transformedColor = transformColor(cleanedColor);

                              return (
                                <div key={itemIndex}>
                                  <Group gap="xs">
                                    {item.sku && (
                                      <Text size="sm" c="dimmed">{item.sku}</Text>
                                    )}
                                    {item.sku && item.variantTitle && (
                                      <Text size="sm" c="dimmed">-</Text>
                                    )}
                                    {item.variantTitle && (
                                      <Text size="sm" c="dimmed">{cleanedColor}</Text>
                                    )}
                                    {item.variant?.metafields?.map((metafield, index) => {
                                      if (metafield.namespace === 'custom' && 
                                          (metafield.key === 'fichier_d_impression' || metafield.key === 'verso_impression')) {
                                        return (
                                          <Badge
                                            key={index}
                                            variant="light"
                                            color="gray"
                                            radius="xl"
                                            size="lg"
                                          >
                                            {metafield.value}
                                          </Badge>
                                        );
                                      }
                                      return null;
                                    })}
                                  </Group>
                                  <VariantCheckboxes
                                    orderId={`gid://shopify/Order/${order.id}`}
                                    sku={item.sku || ''}
                                    color={transformedColor}
                                    size={size || ''}
                                    itemIndex={itemIndex}
                                    quantity={item.quantity}
                                    printFile={item.variant?.metafields?.find(m => m.namespace === 'custom' && m.key === 'fichier_d_impression')?.value}
                                    versoFile={item.variant?.metafields?.find(m => m.namespace === 'custom' && m.key === 'verso_impression')?.value}
                                  />
                                </div>
                              );
                            })}
                          </Stack>
                        </Table.Td>
                        <Table.Td>
                          <ManutentionCell order={order} />
                        </Table.Td>
                        <Table.Td>
                          <Group gap="md">
                            <BillingCheckbox 
                              orderId={`gid://shopify/Order/${order.id}`}
                            />
                            <OrderTotal order={order} />
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                    <Table.Tr className={styles.totalRow}>
                      <Table.Td colSpan={3} style={{ textAlign: 'right' }}>
                        <Text fw={500}>Total de la semaine HT :</Text>
                      </Table.Td>
                      <Table.Td>
                        <WeekTotal orders={week.orders} />
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
