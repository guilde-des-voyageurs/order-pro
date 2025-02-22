import { Drawer, Title, Text, Stack, Group, Badge, Image } from '@mantine/core';
import { OrderStatus } from '@/components/OrderStatus';
import { FinancialStatus } from '@/components/FinancialStatus';
import type { ShopifyOrder } from '@/types/shopify';
import styles from './OrderDrawer.module.scss';

interface OrderDrawerProps {
  order: ShopifyOrder | null;
  opened: boolean;
  onClose: () => void;
}

export function OrderDrawer({ order, opened, onClose }: OrderDrawerProps) {
  if (!order) return null;

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      title={<Title order={1}>Commande {order.name}</Title>}
      position="right"
      size="lg"
      padding="xl"
    >
      <Stack gap="xl">
        <div>
          <Text size="sm" c="dimmed">Statuts</Text>
          <Group gap="md" mt="xs">
            <OrderStatus orderId={order.id} status={order.displayFulfillmentStatus} />
            <FinancialStatus status={order.displayFinancialStatus} />
          </Group>
        </div>

        <div>
          <Text size="sm" c="dimmed">Date de création</Text>
          <Text mt="xs">
            {new Date(order.createdAt).toLocaleDateString('fr-FR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </div>

        <div>
          <Text size="sm" c="dimmed">Adresse de livraison</Text>
          <Stack gap="xs" mt="xs">
            <Text>{order.shippingAddress?.address1}</Text>
            {order.shippingAddress?.address2 && (
              <Text>{order.shippingAddress.address2}</Text>
            )}
            <Text>
              {order.shippingAddress?.zip} {order.shippingAddress?.city}
            </Text>
            <Text>{order.shippingAddress?.country}</Text>
          </Stack>
        </div>

        <div>
          <Text size="sm" c="dimmed">Produits</Text>
          <Stack gap="md" mt="xs">
            {order.lineItems?.map((item) => (
              <div key={item.id} className={`${styles.product_item} ${item.isCancelled ? styles.cancelled : ''}`}>
                {item.image && (
                  <Image
                    src={item.image.url}
                    alt={item.image.altText || item.title}
                    width={60}
                    height={60}
                    fit="contain"
                  />
                )}
                <div className={styles.product_info}>
                  <Group justify="space-between" align="center" w="100%" h="100%">
                    <div>
                      <Text size="sm" fw={500}>{item.title}</Text>
                      {item.isCancelled && (
                        <Badge color="gray">
                          {item.quantity - item.refundableQuantity} article{item.quantity - item.refundableQuantity > 1 ? 's' : ''} annulé{item.quantity - item.refundableQuantity > 1 ? 's' : ''}
                        </Badge>
                      )}
                      {item.variantTitle && (
                        <Text size="sm" c="dimmed">{item.variantTitle}</Text>
                      )}
                      {item.sku && (
                        <Text size="xs" c="dimmed">SKU: {item.sku}</Text>
                      )}
                      <Text size="sm">Coût unitaire: {item.unitCost} {order.totalPriceCurrency}</Text>
                      <Text size="sm">Total: {item.totalCost} {order.totalPriceCurrency}</Text>
                    </div>
                    <Text size="md" fw={500}>×{item.quantity}</Text>
                  </Group>
                </div>
              </div>
            ))}
          </Stack>
        </div>

        <div>
          <Text size="sm" c="dimmed">Total à facturer</Text>
          <Text mt="xs" fw={500}>
            {order.lineItems?.reduce((total, item) => 
              total + (item.isCancelled ? 0 : item.totalCost),
              0
            ).toFixed(2)} {order.totalPriceCurrency}
          </Text>
        </div>
      </Stack>
    </Drawer>
  );
}
