import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { generateVariantId, getSelectedOptions, getColorFromVariant, getSizeFromVariant } from './variant-helpers';
import { encodeFirestoreId } from './firebase-helpers';
import { HANDLING_FEE } from '@/config/billing';
import type { Order } from '../types/order';
import { calculateItemPrice, PriceRule } from '@/hooks/usePriceRules';
import { transformColor } from './color-transformer';

export function formatItemString(item: Order['lineItems'][0]) {
  // SKU
  const sku = item.sku || '';

  // Transformer la couleur et la taille
  const [color, size] = (item.variantTitle || '').split(' / ');
  const cleanedColor = color?.replace(/\s*\([^)]*\)\s*/g, '').trim() || '';
  const transformedColor = transformColor(cleanedColor);

  // Fichier d'impression
  const printFile = item.variant?.metafields?.find(
    (m: { namespace: string; key: string; value: string }) => m.namespace === 'custom' && m.key === 'fichier_d_impression'
  )?.value || '';

  // Verso impression
  const versoFile = item.variant?.metafields?.find(
    (m: { namespace: string; key: string; value: string }) => m.namespace === 'custom' && m.key === 'verso_impression'
  )?.value || '';

  // Construire la chaîne finale
  const parts = [sku, transformedColor, size, printFile, versoFile].filter(Boolean);
  return parts.join(' - ');
}

export async function calculateOrderTotal(order: Order, rules: PriceRule[]): Promise<number> {
  try {
    if (!order?.lineItems || !Array.isArray(order.lineItems)) {
      console.warn('Invalid order structure: missing or invalid lineItems');
      return 0;
    }

    if (!rules || !Array.isArray(rules)) {
      console.warn('Invalid price rules provided');
      return 0;
    }

    let variantsTotal = 0;

    // Calculer le total des variantes cochées
    const processItem = async (itemIndex: number, item: Order['lineItems'][0]): Promise<number> => {
      if (!item || typeof item.quantity !== 'number') {
        console.warn(`Invalid line item at index ${itemIndex}`);
        return 0;
      }

      let checkedCount = 0;
      const selectedOptions = getSelectedOptions(item);
      const color = getColorFromVariant(item);
      const size = getSizeFromVariant(item);
      
      const promises = Array.from({ length: item.quantity }, async (_, quantityIndex) => {
        try {
          const variantId = generateVariantId(
            `gid://shopify/Order/${order.id}`,
            item.sku || '',
            color,
            size,
            itemIndex,
            quantityIndex,
            selectedOptions
          );

          const variantRef = doc(db, 'variants-ordered-v2', variantId);
          const variantDoc = await getDoc(variantRef);
          return variantDoc.exists() && variantDoc.data()?.checked ? 1 : 0;
        } catch (error) {
          console.error(`Error checking variant at index ${quantityIndex}:`, error);
          return 0;
        }
      });

      const checks = await Promise.all(promises);
      checkedCount = checks.reduce((sum: number, count: number): number => sum + count, 0);

      const itemPrice = calculateItemPrice(formatItemString(item), rules);
      return itemPrice * checkedCount;
    };

    const totals = await Promise.all(
      order.lineItems.map((item: Order['lineItems'][0], index: number) => processItem(index, item))
    );
    variantsTotal = totals.reduce((sum: number, total: number): number => sum + total, 0);

    // Ajouter la manutention seulement si des variants sont cochés
    return variantsTotal > 0 ? variantsTotal + HANDLING_FEE : 0;
  } catch (error) {
    console.error('Error calculating order total:', error);
    return 0;
  }
}
