import { Stack, Paper, Text, Button, SimpleGrid } from '@mantine/core';
import { useEffect, useState, useCallback } from 'react';
import type { ShopifyOrder } from '@/types/shopify';
import { useCheckedVariants } from '@/hooks/useCheckedVariants';
import { db } from '@/firebase/db';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { encodeFirestoreId } from '@/utils/firestore';

interface PriceRule {
  rule: string;
  count: number;
}

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

  // Calculer la string une seule fois
  const itemString = [
    sku,
    color,
    printFile,
    versoFile
  ].filter(Boolean).join(' - ');

  useEffect(() => {
    onCheckedChange(`${orderId}-${index}`, checkedCount, itemString);
  }, [checkedCount, itemString, orderId, index, onCheckedChange]);

  // Déplacer le return null après tous les hooks
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
  const [priceRules, setPriceRules] = useState<PriceRule[]>([]);

  const handleCheckedChange = useCallback((key: string, count: number, itemString: string) => {
    setCheckedItemStrings(prev => ({
      ...prev,
      [key]: { count, string: itemString }
    }));
  }, []);

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
      const newString = docSnap.exists() ? docSnap.data().string : null;
      setCurrentString(newString);

      // Calculer les règles de prix
      if (newString) {
        const rules = newString.split('\n');
        const ruleCounts: Record<string, number> = {};
        rules.forEach((rule: string) => {
          ruleCounts[rule] = (ruleCounts[rule] || 0) + 1;
        });

        setPriceRules(
          Object.entries(ruleCounts)
            .filter(([_, count]) => count > 0)
            .map(([rule, count]) => ({ rule, count }))
        );
      } else {
        setPriceRules([]);
      }
    };
    loadCurrentString();
  }, [order.id]);

  const handleGenerateWorkshopSheet = async () => {
    if (!order.lineItems?.length) return;

    // Ne prendre que les strings des articles cochés (count > 0)
    const allStrings = Object.values(checkedItemStrings)
      .filter(({ count }) => count > 0)
      .flatMap(({ count, string }) => Array(count).fill(string))
      .join('\n');

    const encodedOrderId = encodeFirestoreId(order.id);
    const workshopDoc = doc(db, 'order-workshop-detailed', encodedOrderId);
    
    // Écrit le document en écrasant la valeur précédente
    await setDoc(workshopDoc, {
      id: order.id,
      string: allStrings
    }, { merge: true });

    setCurrentString(allStrings);

    // Mettre à jour les règles de prix immédiatement
    if (allStrings) {
      const rules = allStrings.split('\n');
      const ruleCounts: Record<string, number> = {};
      rules.forEach((rule: string) => {
        ruleCounts[rule] = (ruleCounts[rule] || 0) + 1;
      });

      setPriceRules(
        Object.entries(ruleCounts)
          .filter(([_, count]) => count > 0)
          .map(([rule, count]) => ({ rule, count }))
      );
    } else {
      setPriceRules([]);
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
          onCheckedChange={handleCheckedChange}
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

      {priceRules.length > 0 && (
        <SimpleGrid cols={3} spacing="xs">
          {priceRules.map(({ rule, count }) => (
            <Paper key={rule} withBorder p="xs" radius="md">
              <Text size="sm" fw={500}>{rule}</Text>
              <Text size="xs" c="dimmed">Quantité : {count}</Text>
            </Paper>
          ))}
        </SimpleGrid>
      )}
    </Stack>
  );
}
