import { Stack, Paper, Text, Group, Badge, Button } from '@mantine/core';
import type { ShopifyOrder } from '@/types/shopify';
import { useCheckedVariants } from '@/hooks/useCheckedVariants';
import { db } from '@/firebase/config';
import { doc, setDoc, getDoc, increment } from 'firebase/firestore';

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
    (m: { namespace: string; key: string; value: string }) => 
      m.namespace === 'custom' && m.key === 'fichier_d_impression'
  )?.value || '';
  
  const versoFile = item.variant?.metafields?.find(
    (m: { namespace: string; key: string; value: string }) => 
      m.namespace === 'custom' && m.key === 'verso_impression'
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
  const handleGenerateWorkshopSheet = async () => {
    if (!order.lineItems?.length) return;

    // Pour chaque ligne non annulée
    const processedItems = new Set<string>();

    for (const [index, item] of order.lineItems.entries()) {
      if (item.isCancelled) continue;

      const [color] = (item.variantTitle || '').split(' / ');
      const sku = item.sku || '';
      const printFile = item.variant?.metafields?.find(
        (m: { namespace: string; key: string; value: string }) => 
          m.namespace === 'custom' && m.key === 'fichier_d_impression'
      )?.value;
      const versoFile = item.variant?.metafields?.find(
        (m: { namespace: string; key: string; value: string }) => 
          m.namespace === 'custom' && m.key === 'verso_impression'
      )?.value;

      // SKU + Couleur
      const skuColorKey = `${order.id}--${sku} - ${color}`;
      if (!processedItems.has(skuColorKey)) {
        const skuColorRef = doc(db, 'order-workshop-detailed', skuColorKey);
        const skuColorDoc = await getDoc(skuColorRef);
        
        await setDoc(skuColorRef, {
          nombre: skuColorDoc.exists() ? increment(1) : 1
        }, { merge: true });
        processedItems.add(skuColorKey);
      }

      // Fichier d'impression
      if (printFile) {
        const printFileKey = `${order.id}--${printFile}`;
        if (!processedItems.has(printFileKey)) {
          const printFileRef = doc(db, 'order-workshop-detailed', printFileKey);
          const printFileDoc = await getDoc(printFileRef);
          
          await setDoc(printFileRef, {
            nombre: printFileDoc.exists() ? increment(1) : 1
          }, { merge: true });
          processedItems.add(printFileKey);
        }
      }

      // Fichier verso
      if (versoFile) {
        const versoFileKey = `${order.id}--${versoFile}`;
        if (!processedItems.has(versoFileKey)) {
          const versoFileRef = doc(db, 'order-workshop-detailed', versoFileKey);
          const versoFileDoc = await getDoc(versoFileRef);
          
          await setDoc(versoFileRef, {
            nombre: versoFileDoc.exists() ? increment(1) : 1
          }, { merge: true });
          processedItems.add(versoFileKey);
        }
      }
    }
  };

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
        onClick={handleGenerateWorkshopSheet}
      >
        Générer la fiche atelier
      </Button>
    </Stack>
  );
}
