import { useState, useEffect } from 'react';
import { Button } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/firebase/db';
import { sanitizeId } from '@/utils/sanitize-id';
import { useCheckedVariants } from '@/hooks/useCheckedVariants';
import { calculateItemPrice } from '@/hooks/usePriceRules';
import type { PriceRule } from '@/hooks/usePriceRules';

interface BatchCalculatorProps {
  orderId: string;
  lineItems: Array<{
    sku?: string;
    variantTitle?: string;
    quantity: number;
    variant?: {
      metafields?: Array<{
        namespace: string;
        key: string;
        value: string;
      }>;
    };
  }>;
  rules: PriceRule[];
  onCalculated: (total: number) => void;
}

export function BatchCalculator({ orderId, lineItems, rules, onCalculated }: BatchCalculatorProps) {
  const [isCalculating, setIsCalculating] = useState(false);

  const calculateTotal = async () => {
    setIsCalculating(true);
    const sanitizedOrderId = sanitizeId(orderId);
    try {
      // Calculer le total des prix
      let priceTotal = 0;
      for (let i = 0; i < lineItems.length; i++) {
        const item = lineItems[i];
        const [color, size] = (item.variantTitle || '').split(' / ');

        // Vérifier si la ligne est cochée
        const checkedCount = useCheckedVariants({
          orderId: sanitizedOrderId,
          sku: item.sku || '',
          color: color || '',
          size: size || '',
          quantity: item.quantity,
          productIndex: i,
          lineItems: [item]
        });

        if (checkedCount > 0) {
          const baseItemString = `${item.sku} - ${color}`;
          const basePrice = calculateItemPrice(baseItemString, rules);
          console.log(`Prix pour ${item.sku}: ${basePrice} (${checkedCount} cochés)`);
          priceTotal += basePrice;
        } else {
          console.log(`${item.sku} ignoré (non coché)`);
        }
      }
      console.log('Total des prix:', priceTotal);

      // Récupérer les balances par ligne
      let lineBalancesTotal = 0;
      for (const item of lineItems) {
        const sanitizedSku = sanitizeId(item.sku || '');
        const balanceDoc = await getDoc(doc(db, 'orders', 'textile', 'balances', 'orders', sanitizedOrderId, 'items', sanitizedSku));
        const lineBalance = balanceDoc.exists() ? balanceDoc.data().balance || 0 : 0;
        console.log(`Balance pour ${item.sku}: ${lineBalance}`);
        lineBalancesTotal += lineBalance;
      }
      console.log('Total des balances par ligne:', lineBalancesTotal);

      // Récupérer la balance de commande
      const orderBalanceDoc = await getDoc(doc(db, 'orders', 'textile', 'balances', 'orders', sanitizedOrderId));
      const orderBalance = orderBalanceDoc.exists() ? orderBalanceDoc.data().balance || 0 : 0;
      console.log('Balance de commande:', orderBalance);

      // Calculer le total final
      const total = priceTotal + lineBalancesTotal + orderBalance;
      console.log('Total final:', total, '=', priceTotal, '+', lineBalancesTotal, '+', orderBalance);

      await setDoc(doc(db, 'orders', 'textile', 'balances', 'orders', sanitizedOrderId), {
        total,
        billedAt: new Date().toISOString()
      }, { merge: true });

      onCalculated(total);
      notifications.show({
        title: 'Succès',
        message: 'Total calculé et enregistré',
        color: 'green'
      });
    } catch (error) {
      console.error('Error calculating total:', error);
      notifications.show({
        title: 'Erreur',
        message: 'Erreur lors du calcul du total',
        color: 'red'
      });
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <Button
      onClick={calculateTotal}
      loading={isCalculating}
      disabled={!orderId}
    >
      Facturer
    </Button>
  );
}
