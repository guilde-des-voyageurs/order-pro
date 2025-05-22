import { Box, Container, Title, Paper, Text, Group, Badge, Stack, Grid, Tooltip } from '@mantine/core';
import { VariantCheckbox } from '@/components/VariantCheckbox';
import { useEffect, useState } from 'react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/db';
import { formatDate } from '@/utils/date-helpers';
import { encodeFirestoreId } from '@/utils/firebase-helpers';
import { generateVariantId } from '@/utils/variant-helpers';
import { BillingCheckbox } from '@/components/BillingCheckbox';
import styles from './StockInvoicesPage.module.scss';
import { calculateVariantPrice, formatPrice } from '@/utils/pricing';
import { transformColor, colorMappings } from '@/utils/color-transformer';

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
                    .map((item, index) => {
                      const [rawColor, size] = item.variantTitle?.split(' / ') || ['', ''];
                      // Clean color by removing parentheses content
                      const color = rawColor.replace(/\s*\([^)]*\)/g, '').trim();
                      return (
                      <Grid key={item.id} align="center">
                        <Grid.Col span={9}>
                          <Group gap="xs" wrap="nowrap">
                            <Stack gap={2}>
                              <Text size="sm" fw={500}>
                                × {item.quantity} - {item.title}
                              </Text>
                              <Group gap="xs">
                                <Badge variant="light" color="blue" size="sm">{item.sku}</Badge>
                                <Badge variant="light" color="grape" size="sm">
                                  {(() => {
                                    // Remove anything between parentheses and clean up
                                    const cleanColor = color.replace(/\s*\([^)]*\)/g, '').trim();
                                    const normalizedColor = cleanColor.toLowerCase()
                                      .normalize('NFD')
                                      .replace(/[\u0300-\u036f]/g, '');
                                    const mapping = colorMappings[normalizedColor];
                                    return mapping ? mapping.internalName : color;
                                  })()} / {size}
                                </Badge>
                                <Badge variant="light" color="teal" size="sm">
                                  {item.title.includes('VR1') ? 'VR1' :
                                   item.title.includes('VR2') ? 'VR2' :
                                   item.title.includes('CUI') ? 'CUI' :
                                   item.title.includes('OPA') ? 'OPA' : 'N/A'}
                                </Badge>
                              </Group>
                            </Stack>
                            {(() => {
                              const price = calculateVariantPrice({
                                sku: item.sku || '',
                                color: color,
                                printFile: item.title.includes('VR1') ? 'VR1' :
                                          item.title.includes('VR2') ? 'VR2' :
                                          item.title.includes('CUI') ? 'CUI' :
                                          item.title.includes('OPA') ? 'OPA' : undefined
                              });
                              return price !== null ? (
                                <Tooltip label="Prix selon les règles définies">
                                  <Badge variant="light" color="blue">
                                    {formatPrice(price)}
                                  </Badge>
                                </Tooltip>
                              ) : null;
                            })()}
                          </Group>
                        </Grid.Col>
                        <Grid.Col span={3}>
                          <Group gap="xs">
                            {Array.from({ length: item.quantity }).map((_, quantityIndex) => (
                              <VariantCheckbox
                                key={`${order.id}-${item.sku}-${quantityIndex}`}
                                orderId={encodeFirestoreId(order.id)}
                                sku={item.sku || ''}
                                color={color}
                                size={size}
                                quantity={1}
                                productIndex={quantityIndex}
                                variantId={generateVariantId(
                                  encodeFirestoreId(order.id),
                                  item.sku || '',
                                  color,
                                  size,
                                  quantityIndex,
                                  0
                                )}
                              />
                            ))}
                          </Group>
                        </Grid.Col>
                      </Grid>
                    );
                  })}
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
