import { Text } from '@mantine/core';
import { useCheckedVariants } from '@/hooks/useCheckedVariants';
import { formatItemString } from '@/utils/order-total';
import { doc, getFirestore, getDoc } from 'firebase/firestore';
import { getColorFromVariant, getSizeFromVariant } from '@/utils/variant-helpers';
import { reverseTransformColor } from '@/utils/color-transformer';
import { PriceRule, calculateItemPrice } from '@/hooks/usePriceRules';

interface CostRowProps {
  orderId: string;
  item: {
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
  };
  index: number;
  rules: PriceRule[];
}

export function CostRow({ orderId, item, index, rules }: CostRowProps) {
  if (!item.sku) return null;
  const rawColor = getColorFromVariant(item);
  // Convertir la couleur en français pour correspondre aux règles de facturation
  const color = reverseTransformColor(rawColor);
  const size = getSizeFromVariant(item);

  const checkedCount = useCheckedVariants({
    orderId,
    sku: item.sku,
    color: rawColor, // On garde la couleur originale pour le matching Firebase
    size: size,
    quantity: item.quantity,
    productIndex: index,
    lineItems: [item]
  });

  // Ne pas afficher si aucune variante n'est cochée
  if (checkedCount === 0) return null;

  const parts = [];
  let totalPrice = 0;

  // SKU + Couleur
  if (item.sku && item.variantTitle) {
    // Utiliser la couleur en français pour le calcul du prix et l'affichage
    const baseItemString = `${item.sku} - ${color}`;
    const basePrice = calculateItemPrice(baseItemString, rules);
    totalPrice += basePrice;
    parts.push(`${item.sku} - ${color} (${basePrice.toFixed(2)}€)`);
  }

  // Fichier d'impression
  const printFile = item.variant?.metafields?.find(m => 
    m.namespace === 'custom' && m.key === 'fichier_d_impression'
  );
  if (printFile) {
    const printPrice = rules.find(r => r.searchString.toLowerCase() === printFile.value.toLowerCase())?.price || 0;
    totalPrice += printPrice;
    parts.push(`${printFile.value} (${printPrice.toFixed(2)}€)`);
  }

  // Verso impression
  const versoFile = item.variant?.metafields?.find(m => 
    m.namespace === 'custom' && m.key === 'verso_impression'
  );
  if (versoFile) {
    const versoPrice = rules.find(r => r.searchString.toLowerCase() === versoFile.value.toLowerCase())?.price || 0;
    totalPrice += versoPrice;
    parts.push(`${versoFile.value} (${versoPrice.toFixed(2)}€)`);
  }

  return (
    <Text size="sm" style={{ fontSize: '0.7rem', lineHeight: 1.3 }}>
      {checkedCount}x (
        {parts.join(' +\n        ')} = {(totalPrice * checkedCount).toFixed(2)}€
      )
    </Text>
  );
}
