import { Box, Container, Title, Paper, Text, Group, Badge, Stack, Grid } from '@mantine/core';
import { VariantCheckbox } from '@/components/VariantCheckbox';
import { useEffect, useState } from 'react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/db';
import { formatDate } from '@/utils/date-helpers';
import { encodeFirestoreId } from '@/utils/firebase-helpers';
import { generateVariantId } from '@/utils/variant-helpers';
import { BillingCheckbox } from '@/components/BillingCheckbox';
import styles from './StockInvoicesPage.module.scss';

interface Order {
  id: string;
  name: string;
  createdAt: string;
  note?: string;
  tags?: string[];
  displayFulfillmentStatus?: string;
  displayFinancialStatus?: string;
  lineItems?: Array<{
    id: string;
    title: string;
    quantity: number;
    sku?: string;
    variantTitle?: string;
    isCancelled?: boolean;
  }>;
}

export function StockInvoicesPage() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const ordersRef = collection(db, 'orders-v2');
    const q = query(ordersRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const orders = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Order))
        .filter(order => 
          order.tags?.some(tag => tag.toLowerCase().includes('batch')) &&
          order.displayFulfillmentStatus?.toLowerCase() !== 'fulfilled' &&
          order.displayFinancialStatus?.toLowerCase() !== 'refunded'
        )
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setOrders(orders);
    });

    return () => unsubscribe();
  }, []);

  return (
    <Container size="xl">
      <Box mb="xl">
        <Title order={2}>Facturation Stock</Title>
      </Box>

      <Stack gap="md">
        {orders.map((order) => (
          <Paper key={order.id} p="md">
            <Group justify="space-between" align="flex-start">
              <Box>
                <Group gap="xs" align="center">
                  <Text fw={500}>{order.name}</Text>
                  <Text c="dimmed" size="sm">{formatDate(order.createdAt)}</Text>
                </Group>
                {order.note && (
                  <Badge
                    variant="light"
                    color="blue"
                    size="lg"
                    radius="sm"
                    mb="xs"
                    styles={{
                      root: {
                        textTransform: 'none',
                        fontWeight: 400
                      }
                    }}
                  >
                    {order.note}
                  </Badge>
                )}
                <Box mt="xs">
                  {order.tags?.map((tag) => (
                    <Badge
                      key={tag}
                      variant="light"
                      size="sm"
                      mr="xs"
                    >
                      {tag}
                    </Badge>
                  ))}
                </Box>
                <Stack mt="md" gap="xs">
                  {order.lineItems
                    ?.filter(item => !item.isCancelled)
                    .map((item, index) => (
                      <Grid key={item.id} align="center">
                        <Grid.Col span={9}>
                          <Text size="sm">
                            × {item.quantity} - {item.title} - {item.variantTitle} ({item.sku})
                          </Text>
                        </Grid.Col>
                        <Grid.Col span={3}>
                          <Group gap="xs">
                            {Array.from({ length: item.quantity }).map((_, quantityIndex) => (
                              <VariantCheckbox
                                key={`${order.id}-${item.sku}-${quantityIndex}`}
                                orderId={encodeFirestoreId(order.id)}
                                sku={item.sku || ''}
                                color={item.variantTitle?.split(' / ')[0] || ''}
                                size={item.variantTitle?.split(' / ')[1] || ''}
                                quantity={1}
                                productIndex={quantityIndex}
                                variantId={generateVariantId(
                                  encodeFirestoreId(order.id),
                                  item.sku || '',
                                  item.variantTitle?.split(' / ')[0] || '',
                                  item.variantTitle?.split(' / ')[1] || '',
                                  quantityIndex,
                                  0
                                )}
                              />
                            ))}
                          </Group>
                        </Grid.Col>
                      </Grid>
                  ))}
                </Stack>
              </Box>
              <BillingCheckbox orderId={encodeFirestoreId(order.id)} />
            </Group>
          </Paper>
        ))}
      </Stack>
    </Container>
  );
}
