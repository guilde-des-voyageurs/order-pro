import { Stack, Paper, Text, Button } from '@mantine/core';
import { useEffect, useState, useCallback } from 'react';
import type { ShopifyOrder } from '@/types/shopify';
import { useCheckedVariants } from '@/hooks/useCheckedVariants';
import { db } from '@/firebase/db';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { encodeFirestoreId } from '@/utils/firestore';

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
  const displayedItems = order.lineItems?.filter(item => !item.isCancelled) || [];
  const [checkedItemStrings, setCheckedItemStrings] = useState<Record<string, { count: number; string: string }>>({});
  const [currentString, setCurrentString] = useState<string | null>(null);

  // Réinitialiser les states quand on change de commande
  useEffect(() => {
    setCheckedItemStrings({});
  }, [order.id]);

  // Charger la string actuelle du document
  useEffect(() => {
    const loadCurrentString = async () => {
      const encodedOrderId = encodeFirestoreId(order.id);
      const workshopDoc = doc(db, 'order-workshop-detailed', encodedOrderId);
      const docSnap = await getDoc(workshopDoc);
      setCurrentString(docSnap.exists() ? docSnap.data().string : null);
    };
    loadCurrentString();
  }, [order.id]);

  const handleGenerateWorkshopSheet = async () => {
    if (!order.lineItems?.length) return;

    // Concaténer toutes les strings des articles cochés
    const allStrings = Object.values(checkedItemStrings)
      .flatMap(({ count, string }) => Array(count).fill(string))
      .join('\n');

    // Créer un unique document avec toutes les strings
    const encodedOrderId = encodeFirestoreId(order.id);
    const workshopDoc = doc(db, 'order-workshop-detailed', encodedOrderId);
    
    // Écrit le document en écrasant la valeur précédente
    await setDoc(workshopDoc, {
      id: order.id,
      string: allStrings
    }, { merge: true });

    // Mettre à jour l'affichage
    setCurrentString(allStrings);
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
          onCheckedChange={useCallback((key, count, itemString) => {
            setCheckedItemStrings(prev => ({
              ...prev,
              [key]: { count, string: itemString }
            }));
          }, [])}
        />
      ))}
      <Button 
        fullWidth 
        variant="light" 
        color="blue"
        onClick={handleGenerateWorkshopSheet}
        mb="md"
      >
        Générer la fiche atelier
      </Button>

      {currentString && (
        <Paper withBorder p="xs">
          <Text>{currentString}</Text>
        </Paper>
      )}
    </Stack>
  );
}
