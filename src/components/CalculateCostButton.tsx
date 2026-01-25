import { Button } from '@mantine/core';
import { useState } from 'react';
import { doc, setDoc, collection, query, where, getDocs, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/db';
import { HANDLING_FEE } from '@/config/billing';
import { generateVariantId, getColorFromVariant, getSizeFromVariant, getSelectedOptions } from '@/utils/variant-helpers';
import { reverseTransformColor } from '@/utils/color-transformer';
import { PriceRule, calculateItemPrice } from '@/hooks/usePriceRules';

interface CalculateCostButtonProps {
  orderId: string;
  lineItems: Array<{
    sku?: string;
    variantTitle?: string;
    quantity: number;
    variant?: {
      id?: string;
      metafields?: Array<{
        namespace: string;
        key: string;
        value: string;
      }>;
      selectedOptions?: Array<{
        name: string;
        value: string;
      }>;
    };
  }>;
  rules: PriceRule[];
}

export function CalculateCostButton({ orderId, lineItems, rules }: CalculateCostButtonProps) {
  const [isCalculating, setIsCalculating] = useState(false);
  const calculateTotalCost = async () => {
    setIsCalculating(true);
    try {
      // Récupérer la balance de la commande
      const balanceRef = doc(db, 'orders-balance', orderId);
      const balanceSnap = await getDoc(balanceRef);
      const balance = balanceSnap.exists() ? balanceSnap.data().amount || 0 : 0;

      let totalCost = 0;
      let hasCheckedVariants = false;

      // Filtrer les lineItems qui ont un SKU
      const validLineItems = lineItems.filter(item => item.sku);

      // Calculer le coût pour chaque ligne
      for (let index = 0; index < validLineItems.length; index++) {
        const item = validLineItems[index];
        const rawColor = getColorFromVariant(item);
        // Convertir la couleur en français pour correspondre aux règles de facturation
        const color = reverseTransformColor(rawColor);
        const size = getSizeFromVariant(item);
        const selectedOptions = getSelectedOptions(item);
        
        // Générer les IDs pour toutes les variantes de cette ligne
        // ATTENTION : On utilise rawColor (originale) pour les IDs Firebase
        const variantIds = Array.from({ length: item.quantity }).map((_, quantityIndex) => {
          return generateVariantId(
            orderId,
            item.sku || '',
            rawColor,
            size,
            index,
            quantityIndex,
            selectedOptions
          );
        });

        // Compter les variantes cochées
        const checkedVariantsQuery = query(
          collection(db, 'variants-ordered-v2'),
          where('__name__', 'in', variantIds)
        );
        const checkedVariantsSnapshot = await getDocs(checkedVariantsQuery);
        const checkedCount = checkedVariantsSnapshot.docs.filter(doc => doc.data().checked).length;

        // Si des variantes sont cochées, calculer leur coût
        if (checkedCount > 0) {
          hasCheckedVariants = true;
          let itemCost = 0;

          // Prix de base (SKU + couleur en français)
          const baseItemString = `${item.sku} - ${color}`;
          const basePrice = calculateItemPrice(baseItemString, rules);
          itemCost += basePrice;

          // Prix du fichier d'impression
          const printFile = item.variant?.metafields?.find(m => m.namespace === 'custom' && m.key === 'fichier_d_impression');
          if (printFile) {
            const printPrice = rules.find(r => r.searchString.toLowerCase() === printFile.value.toLowerCase())?.price || 0;
            itemCost += printPrice;
          }

          // Prix du verso
          const versoFile = item.variant?.metafields?.find(m => m.namespace === 'custom' && m.key === 'verso_impression');
          if (versoFile) {
            const versoPrice = rules.find(r => r.searchString.toLowerCase() === versoFile.value.toLowerCase())?.price || 0;
            itemCost += versoPrice;
          }

          // Multiplier par le nombre de variantes cochées
          totalCost += itemCost * checkedCount;
        }
      }

      // Ajouter la manutention une seule fois si au moins une variante est cochée
      if (hasCheckedVariants) {
        totalCost += HANDLING_FEE;
      }

      // Sauvegarder dans Firebase
      try {
        await setDoc(doc(db, 'orders-cost', orderId), {
          total: totalCost + balance,
          updatedAt: new Date().toISOString(),
        });
      } catch (error) {
        console.error('Erreur lors de l\'enregistrement du coût:', error);
      }
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <Button 
      size="xs"
      variant="light"
      onClick={calculateTotalCost}
    >
      Calculer le coût
    </Button>
  );
}
