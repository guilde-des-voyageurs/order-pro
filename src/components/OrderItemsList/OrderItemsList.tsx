import { Stack, Paper, Text, Group, Badge, Button } from '@mantine/core';
import type { ShopifyOrder } from '@/types/shopify';
import { useCheckedVariants } from '@/hooks/useCheckedVariants';

interface OrderItemsListProps {
  order: ShopifyOrder;
}

interface OrderItemProps {
  item: NonNullable<ShopifyOrder['lineItems']>[number];
  orderId: string;
  index: number;
}

function OrderItem({ item, orderId, index }: OrderItemProps) {
  const sku = item.sku || '';
  const [color, size] = (item.variantTitle || '').split(' / ');
  
  const checkedCount = useCheckedVariants({
    orderId: orderId,
    sku: sku,
    color: color || '',
    size: size || '',
    productIndex: index,
    quantity: item.quantity,
    lineItems: [{
      sku: sku,
      variantTitle: item.variantTitle || undefined,
      quantity: item.quantity
    }]
  });
  
  // Fichiers d'impression
  const printFile = item.variant?.metafields?.find(
    m => m.namespace === 'custom' && m.key === 'fichier_d_impression'
  )?.value || '';
  
  const versoFile = item.variant?.metafields?.find(
    m => m.namespace === 'custom' && m.key === 'verso_impression'
  )?.value || '';

  // Construire la chaîne d'affichage
  const displayParts = [
    sku,
    color,
    printFile,
    versoFile
  ].filter(Boolean);

  if (checkedCount === 0) {
    return null;
  }

  return (
    <Paper withBorder p="xs">
      <Group justify="space-between">
        <Text>{displayParts.join(' - ')}</Text>
        <Badge color="blue" variant="light">
          {checkedCount} {checkedCount > 1 ? 'articles cochés' : 'article coché'}
        </Badge>
      </Group>
    </Paper>
  );
}

export function OrderItemsList({ order }: OrderItemsListProps) {
  if (!order.lineItems?.length) {
    return null;
  }

  return (
    <Stack gap="xs">
      {order.lineItems.map((item, index) => !item.isCancelled ? (
        <OrderItem 
          key={index} 
          item={item} 
          orderId={order.id}
          index={index}
        />
      ) : null)}
      <Button 
        fullWidth 
        variant="light" 
        color="blue"
      >
        Générer la fiche atelier
      </Button>
    </Stack>
  );
}
