import { Text } from '@mantine/core';
import { useCheckedVariants } from '@/hooks/useCheckedVariants';
import { calculateItemPrice } from '@/hooks/usePriceRules';
import { formatItemString } from '@/utils/order-total';
import type { PriceRule } from '@/hooks/usePriceRules';
import { doc, getFirestore, getDoc } from 'firebase/firestore';

interface CostRowProps {
  orderId: string;
  sku: string;
  quantity: number;
  productIndex: number;
  rules: PriceRule[];
  variantTitle?: string;
  variant?: {
    metafields?: Array<{
      namespace: string;
      key: string;
      value: string;
    }>;
  };
}

export function CostRow({ orderId, sku, quantity, productIndex, rules, variantTitle, variant }: CostRowProps) {
  const [color, size] = (variantTitle || '').split(' / ');
  
  const checkedCount = useCheckedVariants({
    orderId,
    sku,
    color: color || '',
    size: size || '',
    quantity,
    productIndex,
    lineItems: [{ sku, quantity, variantTitle, variant }]
  });

  // Ne pas afficher si aucune variante n'est cochée
  if (checkedCount === 0) return null;

  const parts = [];
  let totalPrice = 0;

  // SKU + Couleur
  if (sku && variantTitle) {
    const baseItemString = `${sku} - ${color}`;
    const basePrice = calculateItemPrice(baseItemString, rules);
    totalPrice += basePrice;
    parts.push(`${sku} - ${color} (${basePrice.toFixed(2)}€)`);
  }

  // Fichier d'impression
  const printFile = variant?.metafields?.find((m: { namespace: string; key: string; value: string; }) => 
    m.namespace === 'custom' && m.key === 'fichier_d_impression'
  );
  if (printFile) {
    const printPrice = rules.find(r => r.searchString.toLowerCase() === printFile.value.toLowerCase())?.price || 0;
    totalPrice += printPrice;
    parts.push(`${printFile.value} (${printPrice.toFixed(2)}€)`);
  }

  // Verso impression
  const versoFile = variant?.metafields?.find((m: { namespace: string; key: string; value: string; }) => 
    m.namespace === 'custom' && m.key === 'verso_impression'
  );
  if (versoFile) {
    const versoPrice = rules.find(r => r.searchString.toLowerCase() === versoFile.value.toLowerCase())?.price || 0;
    totalPrice += versoPrice;
    parts.push(`${versoFile.value} (${versoPrice.toFixed(2)}€)`);
  }

  return (
    <Text size="sm">
      {checkedCount}x (
        {parts.join(' +\n        ')} = {(totalPrice * checkedCount).toFixed(2)}€
      )
    </Text>
  );
}
