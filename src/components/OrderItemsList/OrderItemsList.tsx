import { Stack, Paper, Text, Button } from '@mantine/core';
import { useEffect, useState } from 'react';
import type { ShopifyOrder } from '@/types/shopify';
import { useCheckedVariants } from '@/hooks/useCheckedVariants';
import { db } from '@/firebase/db';
import { collection, deleteDoc, doc, getDocs, increment, query, setDoc, where } from 'firebase/firestore';
import { encodeFirestoreId } from '@/utils/firestore';
import { usePriceRules } from '@/hooks/usePriceRules';

interface OrderItemsListProps {
  order: ShopifyOrder;
}

interface OrderItemProps {
  item: NonNullable<ShopifyOrder['lineItems']>[number];
  orderId: string;
  index: number;
}

function OrderItem({ item, orderId, index, onCheckedChange }: OrderItemProps & { onCheckedChange: (key: string, count: number, itemString: string) => void }) {
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

  useEffect(() => {
    const itemString = [
      sku,
      color,
      printFile,
      versoFile
    ].filter(Boolean).join(' - ');

    onCheckedChange(`${orderId}-${index}`, checkedCount, itemString);
  }, [checkedCount, sku, color, printFile, versoFile, orderId, index, onCheckedChange]);

  if (checkedCount === 0) {
    return null;
  }

  return (
    <Paper withBorder p="xs">
      <Text>
        {Array.from({ length: checkedCount })
          .map(() => [
            sku,
            color,
            printFile,
            versoFile
          ].filter(Boolean).join(' - '))
          .join(', ')}
      </Text>
    </Paper>
  );
}

export function OrderItemsList({ order }: OrderItemsListProps) {
  const { rules } = usePriceRules();
  const displayedItems = order.lineItems?.filter(item => !item.isCancelled) || [];
  const [checkedItemStrings, setCheckedItemStrings] = useState<Record<string, { count: number; string: string }>>({});

  const handleGenerateWorkshopSheet = async () => {
    if (!order.lineItems?.length) return;

    // Remettre à zéro les compteurs existants
    const workshopRef = collection(db, 'order-workshop-detailed');
    const encodedOrderId = encodeFirestoreId(order.id);
    const q = query(workshopRef, where('__name__', '>=', encodedOrderId), where('__name__', '<', encodedOrderId + '\uf8ff'));
    const querySnapshot = await getDocs(q);
    for (const doc of querySnapshot.docs) {
      await setDoc(doc.ref, { id: doc.id, nombre: 0 }, { merge: true });
    }

    // Pour chaque ligne avec des articles cochés
    for (const [key, { count, string: itemString }] of Object.entries(checkedItemStrings)) {
      // Scanner les règles de prix
      for (const rule of rules) {
        if (rule.searchString && itemString.toLowerCase().includes(rule.searchString.toLowerCase())) {
          const ruleDocRef = doc(db, 'order-workshop-detailed', `${encodedOrderId}--${encodeFirestoreId(rule.searchString)}`);
          const docId = `${encodedOrderId}--${encodeFirestoreId(rule.searchString)}`;
          await setDoc(ruleDocRef, { id: docId, nombre: increment(count) }, { merge: true });
        }
      }
    }
  };

  if (!order.lineItems?.length) {
    return null;
  }

  return (
    <Stack gap="xs">
      {displayedItems.map((item, index) => (
        <OrderItem 
          key={index} 
          item={item} 
          orderId={order.id}
          index={index}
          onCheckedChange={(key, count, itemString) => {
            setCheckedItemStrings(prev => ({
              ...prev,
              [key]: { count, string: itemString }
            }));
          }}
        />
      ))}
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
