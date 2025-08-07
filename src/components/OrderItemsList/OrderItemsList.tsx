import { Stack, Paper, Text, Button } from '@mantine/core';
import { useEffect, useState, useCallback } from 'react';
import type { ShopifyOrder } from '@/types/shopify';
import { useCheckedVariants } from '@/hooks/useCheckedVariants';
import { db } from '@/firebase/db';
import { doc, setDoc, getDoc, collection, getDocs } from 'firebase/firestore';
import { encodeFirestoreId } from '@/utils/firestore';

interface PriceRule {
  id: string;
  searchString: string;
  price?: number;
  count?: number;
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

  // Charger toutes les règles de prix
  useEffect(() => {
    const loadPriceRules = async () => {
      try {
        console.log('Loading price rules...');
        const rulesCollection = collection(db, 'price-rules');
        console.log('Collection ref:', rulesCollection);
        
        const rulesSnapshot = await getDocs(rulesCollection);
        console.log('Found rules:', rulesSnapshot.docs.length);
        console.log('Collection price-rules :', rulesSnapshot.docs.length, 'documents');
        const rules = rulesSnapshot.docs.map(doc => {
          const data = doc.data();
          // Afficher les données brutes du document
          console.log('Document price-rules :', {
            id: doc.id,
            data: data,
            searchString: data.searchString,
            searchStringType: typeof data.searchString,
            searchStringLength: data.searchString?.length,
            // Détailler chaque caractère si c'est DTG-CUI
            ...(data.searchString?.includes('DTG') ? {
              chars: [...(data.searchString || '')].map(c => ({ char: c, code: c.charCodeAt(0) })),
              containsDTG: data.searchString?.includes('DTG'),
              containsCUI: data.searchString?.includes('CUI'),
              containsDTGCUI: data.searchString?.includes('DTG-CUI')
            } : {})
          });
          if (!data.searchString) {
            console.warn('Rule missing searchString field:', doc.id);
          }
          return {
            id: doc.id,
            searchString: data.searchString || '',
            price: data.price
          };
        });
        
        console.log('Final rules:', rules);
        setPriceRules(rules);
      } catch (error) {
        console.error('Error loading price rules:', error);
      }
    };
    loadPriceRules();
  }, []);

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
      console.log('Document Firestore :', {
        exists: docSnap.exists(),
        data: docSnap.exists() ? docSnap.data() : null
      });
      const newString = docSnap.exists() ? docSnap.data().string : null;
      console.log('String chargée :', {
        newString,
        length: newString?.length,
        firstChars: newString?.slice(0, 100)
      });
      setCurrentString(newString);

      // Calculer le nombre d'occurrences de chaque règle
      setPriceRules(prev => prev.map(rule => {
        if (!rule.searchString || !newString) return { ...rule, count: 0 };

        // Compter les occurrences
        const lines = newString.split('\n');
        const count = lines.filter((line: string) => line.includes(rule.searchString)).length;

        // Debug pour DTG
        if (rule.searchString.includes('DTG')) {
          const matchingLines = lines.filter((line: string) => line.includes(rule.searchString));
          console.log(`Règle '${rule.searchString}' :`, {
            count,
            matchingLines
          });
          // Afficher chaque ligne qui contient la règle
          matchingLines.forEach((line: string, index: number) => {
            console.log(`  Match ${index + 1}:`, line);
          });
        }

        return { ...rule, count };
      }));
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
    console.log('String à sauvegarder :', {
      allStrings,
      length: allStrings.length,
      firstChars: allStrings.slice(0, 100)
    });
    await setDoc(workshopDoc, {
      id: order.id,
      string: allStrings
    }, { merge: true });
    console.log('Document sauvegardé !');

    setCurrentString(allStrings);

    // Mettre à jour le compteur des règles
    setPriceRules(prev => prev.map(rule => ({
      ...rule,
      count: allStrings ? (allStrings.match(new RegExp(rule.searchString.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length : 0
    })));
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

      {/* Afficher la string globale */}
      {currentString && (
        <Stack mt="md">
          <Text>String générée :</Text>
          <Paper p="xs" withBorder>
            {currentString}
          </Paper>
        </Stack>
      )}

      {priceRules.some(rule => (rule.count || 0) > 0) && (
        <Stack mt="md">
          <Text>Règles de prix trouvées :</Text>
          <Paper p="xs" withBorder>
            {priceRules
              .filter(rule => (rule.count || 0) > 0)
              .map(rule => (
                <Text key={rule.id}>
                  {rule.count || 0}x {rule.searchString}
                  {rule.price && (
                    <Text span ml="md">
                      <Text span c="dimmed">(× {rule.price}€) = </Text>
                      <Text span c="blue" fw={500}>{((rule.count || 0) * rule.price).toFixed(2)}€ HT</Text>
                    </Text>
                  )}
                </Text>
              ))}

            {/* Total général */}
            {priceRules.some(rule => rule.price && rule.count) && (
              <Text mt="md" fw={700} size="lg">
                Total HT : {priceRules
                  .filter(rule => (rule.count || 0) > 0)
                  .reduce((total, rule) => total + ((rule.count || 0) * (rule.price || 0)), 0)
                  .toFixed(2)}€
              </Text>
            )}
          </Paper>
        </Stack>
      )}
    </Stack>
  );
}
