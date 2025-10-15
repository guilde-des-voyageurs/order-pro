import { collection, getDocs, writeBatch, doc, query, where, setDoc } from 'firebase/firestore';
import { db } from '../db';
import { encodeFirestoreId } from '@/utils/firebase-helpers';
import type { ShopifyOrder } from '@/types/shopify';

const ORDERS_COLLECTION = 'orders-v2';

const extractOrderId = (shopifyId: string): string => {
  const match = shopifyId.match(/Order\/([0-9]+)/);
  return match ? match[1] : shopifyId;
};

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

const cleanupVariants = async (orderId: string, encodedOrderId: string) => {
  const variantsRef = collection(db, 'variants-ordered-v2');
  const variantsSnap = await getDocs(query(
    variantsRef,
    where('orderId', '==', encodedOrderId)
  ));

  const batch = writeBatch(db);
  let hasInvalidVariants = false;

  variantsSnap.forEach(doc => {
    if (doc.id.includes('--') && doc.id.split('--').length >= 5) {
      const parts = doc.id.split('--');
      const [docOrderId, sku, part1, part2] = parts;
      if (part1.length <= 3 && part2.length > 3) {
        batch.delete(doc.ref);
        hasInvalidVariants = true;
      }
    }
  });

  if (hasInvalidVariants) {
    await batch.commit();
  }
};

export const ordersService = {
  /**
   * Met à jour le nombre de variants cochés pour une commande
   * @param orderId - L'ID de la commande
   */
  async updateCheckedCount(orderId: string): Promise<void> {
    // orderId est déjà encodé quand il arrive ici
    await cleanupVariants(orderId, orderId);

    const variantsRef = collection(db, 'variants-ordered-v2');
    const variantsSnap = await getDocs(query(
      variantsRef,
      where('orderId', '==', orderId)
    ));
    
    const uniqueVariants = new Set();
    variantsSnap.forEach(doc => {
      const data = doc.data();
      if (!data.checked) return;

      if (doc.id.includes('--')) {
        uniqueVariants.add(doc.id);
      }
    });

    const progressRef = doc(db, 'textile-progress-v2', orderId);
    
    await setDoc(progressRef, {
      checkedCount: uniqueVariants.size
    }, { merge: true });
  },

  /**
   * Synchronise les commandes Shopify avec Firebase
   * @param orders - Les commandes Shopify à synchroniser
   * @returns Promise<void>
   */
  async syncOrders(orders: ShopifyOrder[]): Promise<void> {
    console.log('💾 Préparation de la synchronisation...');
    
    // Filtrer uniquement #1465 et les commandes annulées
    const excludedOrders = orders.filter(order => order.name === '#1465');
    if (excludedOrders.length > 0) {
      console.log('❌ Commande exclue :', excludedOrders.map(order => order.name));
    }
    
    // Synchroniser TOUTES les commandes non annulées (y compris celles déjà expédiées)
    const ordersToSync = orders.filter(order => !order.cancelledAt && order.name !== '#1465');
    
    const fulfilledCount = ordersToSync.filter(o => o.displayFulfillmentStatus?.toLowerCase() === 'fulfilled').length;
    const unfulfilledCount = ordersToSync.length - fulfilledCount;
    
    console.log(`🔄 Synchronisation de ${ordersToSync.length} commandes sur ${orders.length} totales`);
    console.log(`   📦 ${unfulfilledCount} en cours | ✅ ${fulfilledCount} expédiées`);
    console.log('💾 Préparation du batch d\'écriture...');
    
    const batch = writeBatch(db);
    const ordersRef = collection(db, ORDERS_COLLECTION);
    console.log('💾 Collection cible :', ORDERS_COLLECTION);

    ordersToSync.forEach((order) => {
      const statusIcon = order.displayFulfillmentStatus?.toLowerCase() === 'fulfilled' ? '✅' : '📦';
      console.log(`${statusIcon} ${order.name} | ${order.displayFulfillmentStatus} | ${order.lineItems?.length || 0} articles`);

      const sanitizedId = sanitizeShopifyId(order.id);
      const docRef = doc(ordersRef, sanitizedId);

      // Transformer les données avant sauvegarde en s'assurant qu'elles sont sérialisables
      const rawOrderData = {
        id: order.id,
        name: order.name,
        orderNumber: order.name?.replace('#', ''),
        createdAt: order.createdAt,
        cancelledAt: order.cancelledAt || null,
        displayFulfillmentStatus: order.displayFulfillmentStatus,
        displayFinancialStatus: order.displayFinancialStatus,
        totalPrice: order.totalPrice?.toString(),
        totalPriceCurrency: order.totalPriceCurrency,
        note: order.note || null,
        tags: order.tags || [],
        lineItems: (order.lineItems || []).map((item) => ({
          id: item.id,
          title: item.title || null,
          quantity: item.quantity || 0,
          refundableQuantity: item.refundableQuantity || 0,
          price: item.price?.toString() || "0",
          sku: item.sku || null,
          variantTitle: item.variantTitle || null,
          vendor: item.vendor || null,
          productId: item.productId || null,
          requiresShipping: !!item.requiresShipping,
          taxable: !!item.taxable,
          image: item.image || null,
          unitCost: item.unitCost || 0,
          totalCost: item.totalCost || 0,
          isCancelled: !!item.isCancelled,
          variant: {
            id: item.variant?.id || '',
            title: item.variant?.title || '',
            metafields: item.variant?.metafields || []
          }
        })),
        synced_at: new Date().toISOString()
      };

      // Sauvegarder la commande (écrase les données existantes pour mettre à jour le statut)
      batch.set(docRef, rawOrderData);

      // Initialiser le document textile-progress-v2
      const totalCount = rawOrderData.lineItems.reduce((acc, item) => {
        if (item.isCancelled) return acc;
        return acc + (item.quantity || 0);
      }, 0);

      const encodedOrderId = encodeFirestoreId(order.id);
      const progressRef = doc(db, 'textile-progress-v2', encodedOrderId);
      
      // Ne mettre à jour que le totalCount, pas le checkedCount
      batch.set(progressRef, {
        totalCount
      }, { merge: true });
    });

    try {
      await batch.commit();
      console.log('✅ Synchronisation terminée avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de la synchronisation:', error);
      throw error;
    }
  }
};
