import { Title, Stack, Paper, Text, Button, Box, Grid, Group, Alert } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';
import { useEffect, useState, useCallback } from 'react';
import type { ShopifyOrder } from '@/types/shopify';
import { useCheckedVariants } from '@/hooks/useCheckedVariants';
import { db } from '@/firebase/db';
import { doc, setDoc, getDoc, collection, getDocs, onSnapshot } from 'firebase/firestore';
import { encodeFirestoreId } from '@/utils/firestore';
import { BatchBalance } from '@/components/BatchBalance/BatchBalance';
import { getColorFromVariant, getSizeFromVariant } from '@/utils/variant-helpers';
import { reverseTransformColor } from '@/utils/color-transformer';

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
  // Utiliser les helpers pour extraction correcte avec transformation de couleur
  const colorEnglish = getColorFromVariant(item);
  const size = getSizeFromVariant(item);
  
  const checkedCount = useCheckedVariants({
    orderId: orderId,
    sku: sku,
    color: colorEnglish || '',
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

  // Transformer la couleur anglaise en français pour la string de facturation
  const colorFrench = reverseTransformColor(colorEnglish);

  // Calculer la string une seule fois (avec couleur en français)
  const itemString = [
    sku,
    colorFrench,
    printFile,
    versoFile
  ].filter(Boolean).join(' - ');

  // Toujours appeler onCheckedChange, même si count = 0 ou article annulé
  useEffect(() => {
    // Si l'article est annulé, on force count = 0
    const finalCount = item.isCancelled ? 0 : checkedCount;
    onCheckedChange(`${orderId}-${index}`, finalCount, itemString);
  }, [checkedCount, itemString, orderId, index, onCheckedChange, item.isCancelled]);

  // Ne rien afficher si count = 0 ou article annulé
  if (checkedCount === 0 || item.isCancelled) {
    return null;
  }

  return (
    <Paper withBorder p="xs">
      <Text>
        {Array.from({ length: checkedCount })
          .map(() => [
            sku,
            colorFrench,
            printFile,
            versoFile
          ].filter(Boolean).join(' - '))
          .join(', ')}
      </Text>
    </Paper>
  );
}

export function OrderItemsList({ order }: OrderItemsListProps) {
  // Ne pas filtrer les articles annulés ici, on les gère dans handleGenerateWorkshopSheet
  const displayedItems = order.lineItems || [];
  const [checkedItemStrings, setCheckedItemStrings] = useState<Record<string, { count: number; string: string }>>({});
  const [currentString, setCurrentString] = useState<string | null>(null);
  const [priceRules, setPriceRules] = useState<PriceRule[]>([]);
  const [balance, setBalance] = useState<number>(0);

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
  
  // Charger la balance depuis Firebase
  useEffect(() => {
    const encodedOrderId = encodeFirestoreId(order.id);
    const unsubscribe = onSnapshot(doc(db, 'BillingNotesBatch', encodedOrderId), (doc) => {
      if (doc.exists()) {
        setBalance(doc.data().balance || 0);
      } else {
        setBalance(0);
      }
    });
    
    return () => unsubscribe();
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

        // Compter les occurrences avec regex (comme dans handleGenerateWorkshopSheet)
        // pour tous les termes de manière cohérente, insensible à la casse
        const count = (newString.match(new RegExp(rule.searchString.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')) || []).length;

        return { ...rule, count };
      }));
    };
    loadCurrentString();
  }, [order.id]);

  const handleGenerateWorkshopSheet = async () => {
    if (!order.lineItems?.length) return;

    // Ne prendre que les strings des articles cochés (count > 0) et non annulés
    const allStrings = Object.entries(checkedItemStrings)
      .filter(([key, { count }]) => {
        // Vérifier si l'article est annulé
        const [orderId, index] = key.split('-');
        const item = order.lineItems?.[parseInt(index)];
        return count > 0 && !item?.isCancelled;
      })
      .flatMap(([_, { count, string }]) => Array(count).fill(string))
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
      count: allStrings ? (allStrings.match(new RegExp(rule.searchString.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')) || []).length : 0
    })));
  };

  if (!order.lineItems?.length) {
    return null;
  }

  return (
    <Stack gap="xs">
      <Title order={2} mb="md">Résumé d'atelier</Title>

      {/* Liste des articles (cachée) */}
      <Box style={{ display: 'none' }}>
        {displayedItems.map((item, index) => (
          <OrderItem 
            key={index} 
            item={item} 
            orderId={order.id}
            index={index}
            onCheckedChange={handleCheckedChange}
          />
        ))}
      </Box>

      {/* Bouton (visible) */}
      <Button 
        fullWidth 
        variant="light" 
        color="blue"
        onClick={handleGenerateWorkshopSheet}
        mb="md"
      >
        Générer la fiche atelier
      </Button>

      {/* Colonnes */}
      <Grid mt="md" gutter="md">
        {/* String générée (colonne gauche) */}
        {currentString && (
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Stack>
              <Text>String générée :</Text>
              <Paper p="xs" withBorder>
                <Text size="12px" c="gray" style={{ whiteSpace: 'pre-wrap' }}>{currentString}</Text>
              </Paper>
            </Stack>
          </Grid.Col>
        )}

        {/* Règles de prix (colonne droite) */}
        {priceRules.some(rule => (rule.count || 0) > 0) && (
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Stack gap="md">
              {(() => {
                // Détecter les termes qui n'ont aucune règle de prix correspondante
                if (!currentString) return null;
                
                const lines = currentString.split('\n').filter(line => line.trim());
                const missingTerms = new Set<string>();
                
                // Liste des couleurs connues
                const knownColors = ['Black', 'French Navy', 'Stargazer', 'Vintage white', 'Raw', 'Green Bay', 
                                    'Burgundy', 'Cream', 'Dusk', 'Khaki', 'Heritage Brown', 'Glazed Green', 
                                    'Bottle Green', 'Red Brown', 'Mocha', 'India Ink Grey', 'Desert', 
                                    'Glazed Green', 'Latte', 'Vert ancien'];
                
                // Termes d'impression connus
                const impressionTerms = ['DTF-CUI', 'DTF-OPA', 'DTF-VR1', 'DTF-VR2', 'DTG-CUI', 'DTG-OPA', 
                                        'DTG-VR1', 'DTG-VR2', 'MARQUE-CUI', 'MARQUE-TSHIRT-CUI', 
                                        'MARQUE-TSHIRT-VR1', 'MARQUE-VR1'];
                
                // Analyser chaque ligne
                lines.forEach(line => {
                  const parts = line.split(' - ').map(p => p.trim()).filter(p => p);
                  
                  // Trouver le SKU + Couleur (les 2 premiers éléments non-impression)
                  const nonImpressionParts = parts.filter(p => !impressionTerms.includes(p));
                  
                  if (nonImpressionParts.length >= 2) {
                    // Combiner SKU + Couleur
                    const skuColor = `${nonImpressionParts[0]} - ${nonImpressionParts[1]}`;
                    
                    // Vérifier si cette combinaison a une règle (insensible à la casse)
                    const hasSkuColorRule = priceRules.some(rule => 
                      rule.searchString && rule.searchString.toLowerCase() === skuColor.toLowerCase()
                    );
                    
                    if (!hasSkuColorRule) {
                      missingTerms.add(skuColor);
                    }
                  }
                  
                  // Vérifier chaque terme d'impression (insensible à la casse)
                  parts.forEach(part => {
                    if (impressionTerms.includes(part)) {
                      const hasImpressionRule = priceRules.some(rule => 
                        rule.searchString && rule.searchString.toLowerCase() === part.toLowerCase()
                      );
                      
                      if (!hasImpressionRule) {
                        missingTerms.add(part);
                      }
                    }
                  });
                });
                
                if (missingTerms.size > 0) {
                  return (
                    <Alert icon={<IconAlertTriangle size="1rem" />} color="red" title="⚠️ Règles de prix manquantes" mb="md">
                      <Text size="sm" mb="xs" fw={500}>
                        Les termes suivants n'ont pas de règle de prix définie :
                      </Text>
                      <Stack gap="xs">
                        {Array.from(missingTerms).sort().map((term, i) => (
                          <Text key={i} size="sm" c="red" fw={500}>
                            • {term}
                          </Text>
                        ))}
                      </Stack>
                      <Text size="xs" c="dimmed" mt="sm">
                        💡 Ajoutez ces règles dans la collection "price-rules" de Firebase
                      </Text>
                    </Alert>
                  );
                }
                return null;
              })()}
              
              <Paper p="xs" withBorder>
                {priceRules
                .filter(rule => (rule.count || 0) > 0)
                .sort((a, b) => {
                  // Extraire le type de produit (ex: CREATOR, DRUMMER, etc.)
                  const productA = a.searchString.split(' ')[0];
                  const productB = b.searchString.split(' ')[0];
                  
                  // D'abord trier par type de produit
                  if (productA !== productB) {
                    return productA.localeCompare(productB);
                  }
                  
                  // Ensuite par la chaîne complète
                  return a.searchString.localeCompare(b.searchString);
                })
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
              {priceRules.some(rule => rule.price && rule.count) && (
                <Stack gap="xs" mt="md">
                  {(() => {
                    // Compter à partir des checkboxes cochées (checkedItemStrings)
                    // au lieu de la string Firebase qui peut être obsolète
                    
                    // Termes qui identifient une IMPRESSION dans une ligne
                    const impressionTerms = ['DTF-CUI', 'DTF-OPA', 'DTF-VR1', 'DTF-VR2', 'DTG-CUI', 'DTG-OPA', 'DTG-VR1', 'DTG-VR2', 'MARQUE-CUI', 'MARQUE-TSHIRT-CUI', 'MARQUE-TSHIRT-VR1', 'MARQUE-VR1'];
                    
                    // Générer la string virtuelle basée sur les checkboxes actuelles
                    const virtualLines = Object.entries(checkedItemStrings)
                      .filter(([key, { count }]) => {
                        const [orderId, index] = key.split('-');
                        const item = order.lineItems?.[parseInt(index)];
                        return count > 0 && !item?.isCancelled;
                      })
                      .flatMap(([_, { count, string }]) => Array(count).fill(string));
                    
                    // Nombre total d'articles = nombre de lignes virtuelles
                    const articlesCount = virtualLines.length;
                    
                    // Compter le nombre total d'impressions dans toutes les lignes
                    let impressionsCount = 0;
                    virtualLines.forEach(line => {
                      // Compter combien de termes d'impression sont présents dans cette ligne
                      impressionTerms.forEach(term => {
                        if (line.includes(term)) {
                          impressionsCount++;
                        }
                      });
                    });
                    
                    console.log('=== COMPTAGE EN TEMPS RÉEL ===');
                    console.log('Articles cochés:', articlesCount);
                    console.log('Impressions:', impressionsCount);
                    
                    return (
                      <>
                        <Text fw={600} size="md" c="dimmed">
                          Articles : {articlesCount}
                        </Text>
                        <Text fw={600} size="md" c="dimmed">
                          Impressions : {impressionsCount}
                        </Text>
                      </>
                    );
                  })()}
                  
                  <Text fw={700} size="lg">
                    Sous-total HT : {priceRules
                      .filter(rule => (rule.count || 0) > 0)
                      .reduce((total, rule) => total + ((rule.count || 0) * (rule.price || 0)), 0)
                      .toFixed(2)}€
                  </Text>
                  
                  <Group align="center">
                    <BatchBalance orderId={order.id} />
                  </Group>
                  
                  <Text fw={700} size="xl" c="blue">
                    Total HT : {(
                      priceRules
                        .filter(rule => (rule.count || 0) > 0)
                        .reduce((total, rule) => total + ((rule.count || 0) * (rule.price || 0)), 0) + balance
                    ).toFixed(2)}€
                  </Text>
                </Stack>
              )}
              </Paper>
            </Stack>
          </Grid.Col>
        )}
      </Grid>
    </Stack>
  );
}
