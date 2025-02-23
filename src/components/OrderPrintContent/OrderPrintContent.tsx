'use client';

import { Text, Title, Stack, Group } from '@mantine/core';
import { forwardRef } from 'react';
import styles from './OrderPrintContent.module.scss';

interface OrderPrintContentProps {
  order: any;
}

export const OrderPrintContent = forwardRef<HTMLDivElement, OrderPrintContentProps>(({ order }, ref) => (
  <div ref={ref} className={styles.print_content}>
    <Stack gap="xl" p="xl">
      <Group justify="space-between">
        <Title order={2}>Bordereau de commande</Title>
        <Text>N° {order.name}</Text>
      </Group>

      <Group>
        <Text>Date: {new Date(order.createdAt).toLocaleDateString('fr-FR')}</Text>
      </Group>

      <Stack gap="md">
        <Title order={3}>Articles</Title>
        {order.lineItems?.map((item: any, index: number) => {
          if (item.isCancelled) return null;
          
          const variants = Array.from({ length: item.quantity }).map((_, idx) => {
            const color = item.variantTitle?.split(' / ')[0] || '';
            const size = item.variantTitle?.split(' / ')[1] || '';
            return { color, size, index: idx };
          });

          return (
            <Stack key={index} gap="xs">
              <Text fw={500}>{item.title}</Text>
              <Text size="sm" c="dimmed">{item.sku}</Text>
              <Group gap="md">
                {variants.map((variant, vIdx) => (
                  <Group key={vIdx} gap="xs">
                    <Text size="sm">
                      {variant.color} / {variant.size}
                    </Text>
                    <Text size="sm" c="dimmed">□</Text>
                  </Group>
                ))}
              </Group>
            </Stack>
          );
        })}
      </Stack>
    </Stack>
  </div>
));
