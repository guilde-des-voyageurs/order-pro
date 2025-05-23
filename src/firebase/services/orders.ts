import { collection, getDocs, writeBatch, doc, query, where, setDoc } from 'firebase/firestore';
import { db } from '../db';
import type { ShopifyOrder } from '@/types/shopify';

const ORDERS_COLLECTION = 'orders-v2';

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
   * Met à jour le nombre de variants cochés pour une commande
   * @param orderId - L'ID de la commande
   */
  async updateCheckedCount(orderId: string): Promise<void> {
    // Récupérer tous les variants cochés pour cette commande
    const variantsRef = collection(db, 'variants-ordered-v2');
    const variantsSnap = await getDocs(query(
      variantsRef,
      where('orderId', '==', orderId),
      where('checked', '==', true)
    ));

    // Mettre à jour le compteur dans textile-progress-v2
    const progressRef = doc(db, 'textile-progress-v2', orderId);
    await setDoc(progressRef, {
      checkedCount: variantsSnap.size
    }, { merge: true });
  },

  /**
   * Synchronise les commandes Shopify avec Firebase
   * @param orders - Les commandes Shopify à synchroniser
   * @returns Promise<void>
   */
  async syncOrders(orders: ShopifyOrder[]): Promise<void> {
    console.log('💾 Préparation de la synchronisation...');
    // Filtrer les commandes non annulées et exclure #1465
    const excludedOrders = orders.filter(order => order.name === '#1465');
    if (excludedOrders.length > 0) {
      console.log('❌ Commande exclue :', excludedOrders.map(order => order.name));
    }
    const activeOrders = orders.filter(order => !order.cancelledAt && order.name !== '#1465');
    console.log(`🔄 Début de la synchronisation de ${activeOrders.length} commandes actives sur ${orders.length} commandes totales`);
    console.log('💾 Préparation du batch d’écriture...');
    
    const batch = writeBatch(db);
    const ordersRef = collection(db, ORDERS_COLLECTION);
    console.log('💾 Collection cible :', ORDERS_COLLECTION);

    activeOrders.forEach((order) => {
      const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      };

      console.log(`
📦 Commande ${order.name}:
- ID: ${order.id}
- Créée le: ${formatDate(order.createdAt)}
- Annulée le: ${order.cancelledAt}
- Statut: ${order.displayFulfillmentStatus}
- Prix total: ${order.totalPrice} ${order.totalPriceCurrency}
- Nb articles: ${order.lineItems?.length || 0}
      `);

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

      console.log('📝 Données à sauvegarder:', JSON.stringify(rawOrderData, null, 2));

      // Sauvegarder la commande
      batch.set(docRef, rawOrderData);

      // Initialiser le document textile-progress-v2
      const totalCount = rawOrderData.lineItems.reduce((acc, item) => {
        if (item.isCancelled) return acc;
        return acc + (item.quantity || 0);
      }, 0);

      const progressRef = doc(db, 'textile-progress-v2', sanitizedId);
      batch.set(progressRef, {
        totalCount,
        checkedCount: 0
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
