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

// Fonction utilitaire pour nettoyer les objets
const cleanObject = (obj: any): any => {
  if (!obj) return null;
  
  const cleaned: any = {};
  
  Object.entries(obj).forEach(([key, value]) => {
    if (value === undefined) return;
    if (value === null) return;
    
    if (typeof value === 'object' && !Array.isArray(value)) {
      cleaned[key] = cleanObject(value);
    } else if (Array.isArray(value)) {
      cleaned[key] = value.map(item => 
        typeof item === 'object' ? cleanObject(item) : item
      ).filter(Boolean);
    } else {
      cleaned[key] = value;
    }
  });
  
  return Object.keys(cleaned).length ? cleaned : null;
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
      const rawOrderData = {
        id: order.id,
        name: order.name,
        createdAt: order.createdAt,
        displayFulfillmentStatus: order.displayFulfillmentStatus,
        displayFinancialStatus: order.displayFinancialStatus,
        totalPrice: order.totalPriceSet.shopMoney.amount,
        totalPriceCurrency: order.totalPriceSet.shopMoney.currencyCode,
        customer: order.customer ? {
          firstName: order.customer.firstName,
          lastName: order.customer.lastName,
          email: order.customer.email,
        } : null,
        shippingAddress: order.shippingAddress ? {
          address1: order.shippingAddress.address1,
          address2: order.shippingAddress.address2,
          city: order.shippingAddress.city,
          zip: order.shippingAddress.zip,
          country: order.shippingAddress.countryCodeV2,
        } : null,
        lineItems: order.lineItems?.nodes?.map((item: any) => ({
          id: item.id,
          title: item.title,
          quantity: item.quantity,
          price: item.originalUnitPriceSet.shopMoney.amount,
          sku: item.sku,
          variantTitle: item.variant?.title,
          vendor: item.product?.vendor,
          productId: item.product?.id,
          requiresShipping: item.requiresShipping,
          taxable: item.taxable,
          image: item.image ? {
            url: item.image.url,
            altText: item.image.altText,
          } : null,
        })),
        synced_at: new Date().toISOString(),
      };

      // Nettoyer les données
      const orderData = cleanObject(rawOrderData);

      if (!orderData) {
        console.error('Invalid order data:', order);
        return;
      }

      batch.set(docRef, orderData, { merge: true });
    });

    await batch.commit();
  },
};
