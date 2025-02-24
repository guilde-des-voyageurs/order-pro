import { collection, getDocs } from 'firebase/firestore';
import { db } from '../db';
import { getDefaultSku } from '@/utils/variant-helpers';

const ORDERS_COLLECTION = 'orders';

export interface Variant {
  id: string;
  title: string;
  sku: string;
  variantTitle: string;
  vendor: string;
  productId: string;
  orderId: string;  // ID de la commande d'origine
  orderNumber: string; // Numéro de la commande client
  productIndex: number;  // Index du produit dans la commande d'origine
  unitCost?: number;
  totalOrders: number;
  totalQuantity: number;
}

export const variantsService = {
  /**
   * Récupère toutes les variantes uniques des commandes
   * @returns Promise<Variant[]> Liste des variantes uniques
   */
  async getAllUniqueVariants(): Promise<Variant[]> {
    const ordersRef = collection(db, ORDERS_COLLECTION);
    const snapshot = await getDocs(ordersRef);
    
    const variantsMap = new Map<string, Variant>();
    
    snapshot.forEach((doc) => {
      const order = doc.data();
      order.lineItems?.forEach((item: any, index: number) => {
        const variantKey = `${item.productId}-${item.id}`;
        
        // Si la variante existe déjà, on garde le premier orderId et productIndex trouvés
        if (variantsMap.has(variantKey)) {
          const variant = variantsMap.get(variantKey)!;
          variant.totalOrders += 1;
          variant.totalQuantity += item.quantity;
        } else {
          // Déterminer le SKU : utiliser celui de Shopify ou le SKU par défaut basé sur le titre
          const sku = item.sku || getDefaultSku(item.title);
          
          variantsMap.set(variantKey, {
            id: item.id,
            title: item.title,
            sku: sku,
            variantTitle: item.variantTitle || '',
            vendor: item.vendor || '',
            productId: item.productId,
            orderId: doc.id,  // ID de la commande d'origine
            orderNumber: order.orderNumber || '', // Numéro de la commande client
            productIndex: index,  // Index du produit dans la commande d'origine
            unitCost: item.unitCost,
            totalOrders: 1,
            totalQuantity: item.quantity
          });
        }
      });
    });
    
    return Array.from(variantsMap.values());
  }
};
