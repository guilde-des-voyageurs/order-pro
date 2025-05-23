import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../db';
import { getDefaultSku } from '@/utils/variant-helpers';
import { encodeFirestoreId } from '@/utils/firebase-helpers';

const ORDERS_COLLECTION = 'orders-v2';

/**
 * Vérifie si une commande doit être exclue du traitement
 * @param order La commande à vérifier
 * @param includeBatch Si true, inclut les commandes batch, sinon les exclut
 * @returns true si la commande doit être exclue
 */
const shouldExcludeOrder = (order: any, includeBatch: boolean = false): boolean => {
  // Une commande est exclue si :
  // 1. Elle est remboursée
  // 2. Elle a un tag qui contient le terme 'batch' (sauf si includeBatch est true)
  const hasBatchTag = order.tags?.some((tag: string) => tag.toLowerCase().includes('batch')) ?? false;
  return order.displayFinancialStatus === 'REFUNDED' ||
    (!includeBatch && hasBatchTag);
};


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

interface VariantsService {
  getAllUniqueVariants(): Promise<Variant[]>;
  getBatchVariants(): Promise<Variant[]>;
}

export const variantsService: VariantsService = {
  /**
   * Récupère toutes les variantes uniques des commandes en cours,
   * en excluant les pourboires et les articles annulés
   * @returns Promise<Variant[]> Liste des variantes uniques
   */
  async getAllUniqueVariants(): Promise<Variant[]> {
    // Créer une requête pour obtenir uniquement les commandes en cours
    const ordersRef = collection(db, ORDERS_COLLECTION);
    // On récupère toutes les commandes non expédiées et on filtre en mémoire
    // car Firestore ne supporte pas les requêtes complexes avec != et array-contains
    const ordersQuery = query(
      ordersRef,
      where('displayFulfillmentStatus', '==', 'UNFULFILLED')
    );
    const snapshot = await getDocs(ordersQuery);
    
    const variantsMap = new Map<string, Variant>();
    
    snapshot.forEach((doc) => {
      const order = doc.data();
      
      // Exclure les commandes remboursées et les commandes batch
      if (shouldExcludeOrder(order, false)) {
        return;
      }
      
      // Ne traiter que les articles non annulés et qui ne sont pas des pourboires
      order.lineItems?.forEach((item: any, index: number) => {
        // Ignorer les articles annulés et les pourboires
        if (item.isCancelled || item.title.toLowerCase().includes('tip')) {
          return;
        }
        
        // Encode les IDs Shopify pour les chemins Firebase
        const encodedProductId = encodeFirestoreId(item.productId);
        const encodedItemId = encodeFirestoreId(item.id);
        const variantKey = `${encodedProductId}-${encodedItemId}`;
        
        // Si la variante existe déjà, on garde le premier orderId et productIndex trouvés
        if (variantsMap.has(variantKey)) {
          const variant = variantsMap.get(variantKey)!;
          variant.totalOrders += 1;
          variant.totalQuantity += item.quantity;
        } else {
          // Déterminer le SKU : utiliser celui de Shopify ou le SKU par défaut basé sur le titre
          const sku = item.sku || getDefaultSku(item.title);
          
          variantsMap.set(variantKey, {
            id: encodedItemId,
            title: item.title,
            sku: sku,
            variantTitle: item.variantTitle || '',
            vendor: item.vendor || '',
            productId: encodedProductId,
            orderId: encodeFirestoreId(doc.id),  // ID de la commande d'origine
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
  },

  /**
   * Récupère toutes les variantes uniques des commandes batch en cours,
   * en excluant les pourboires et les articles annulés
   * @returns Promise<Variant[]> Liste des variantes uniques
   */
  async getBatchVariants(): Promise<Variant[]> {
    // Créer une requête pour obtenir uniquement les commandes batch en cours
    const ordersRef = collection(db, ORDERS_COLLECTION);
    const ordersQuery = query(
      ordersRef,
      where('displayFulfillmentStatus', '==', 'UNFULFILLED')
    );
    const snapshot = await getDocs(ordersQuery);
    
    const variantsMap = new Map<string, Variant>();
    
    snapshot.forEach((doc) => {
      const order = doc.data();
      
      // Pour la page batch, on ne garde que les commandes qui ont un tag contenant 'batch'
      // et qui ne sont pas remboursées
      const hasBatchTag = order.tags?.some((tag: string) => tag.toLowerCase().includes('batch')) ?? false;
      if (!hasBatchTag || order.displayFinancialStatus === 'REFUNDED') {
        return;
      }
      
      // Ne traiter que les articles non annulés et qui ne sont pas des pourboires
      order.lineItems?.forEach((item: any, index: number) => {
        // Ignorer les articles annulés et les pourboires
        if (item.isCancelled || item.title.toLowerCase().includes('tip')) {
          return;
        }
        
        // Encode les IDs Shopify pour les chemins Firebase
        const encodedProductId = encodeFirestoreId(item.productId);
        const encodedItemId = encodeFirestoreId(item.id);
        const variantKey = `${encodedProductId}-${encodedItemId}`;
        
        // Si la variante existe déjà, on garde le premier orderId et productIndex trouvés
        if (variantsMap.has(variantKey)) {
          const variant = variantsMap.get(variantKey)!;
          variant.totalOrders += 1;
          variant.totalQuantity += item.quantity;
        } else {
          // Déterminer le SKU : utiliser celui de Shopify ou le SKU par défaut basé sur le titre
          const sku = item.sku || getDefaultSku(item.title);
          
          variantsMap.set(variantKey, {
            id: encodedItemId,
            title: item.title,
            sku: sku,
            variantTitle: item.variantTitle || '',
            vendor: item.vendor || '',
            productId: encodedProductId,
            orderId: encodeFirestoreId(doc.id),  // ID de la commande d'origine
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
