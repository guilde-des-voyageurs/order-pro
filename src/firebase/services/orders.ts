import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from '../db';
import type { ShopifyOrder } from '@/types/shopify';

const ORDERS_COLLECTION = 'orders';

/**
 * Sanitize un ID Shopify pour qu'il soit utilisable comme chemin Firebase
 * @param shopifyId - L'ID Shopify au format gid://shopify/Order/123456789
 * @returns L'ID sanitizé (juste le numéro)
 */
const sanitizeShopifyId = (shopifyId: string): string => {
  const matches = shopifyId.match(/\/([^/]+)$/);
  if (!matches) {
    throw new Error(`Invalid Shopify ID format: ${shopifyId}`);
  }
  return matches[1];
};

export const ordersService = {
  /**
   * Synchronise les commandes Shopify avec Firebase
   * @param orders - Les commandes Shopify à synchroniser
   * @returns Promise<void>
   */
  async syncOrders(orders: ShopifyOrder[]): Promise<void> {
    const batch = writeBatch(db);
    const ordersRef = collection(db, ORDERS_COLLECTION);

    orders.forEach((order) => {
      const sanitizedId = sanitizeShopifyId(order.id);
      const docRef = doc(ordersRef, sanitizedId);

      // Transformer les données avant sauvegarde
      const orderData = {
        id: order.id,
        name: order.name,
        createdAt: order.createdAt,
        displayFulfillmentStatus: order.displayFulfillmentStatus,
        displayFinancialStatus: order.displayFinancialStatus,
        totalPrice: order.totalPrice,
        totalPriceCurrency: order.currencyCode,
        customer: order.customer,
        shippingAddress: order.shippingAddress,
        lineItems: order.lineItems?.nodes || [],
        synced_at: new Date().toISOString(),
      };

      batch.set(docRef, orderData, { merge: true });
    });

    await batch.commit();
  },
};
