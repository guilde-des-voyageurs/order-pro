'use server';

import { createAdminApiClient } from '@shopify/admin-api-client';
import type { ShopifyOrder } from '@/types/shopify';
import { TEST_QUERY, ORDERS_QUERY } from '@/graphql/queries';
import { getDefaultSku } from '@/utils/variant-helpers';

if (!process.env.SHOPIFY_URL || !process.env.SHOPIFY_TOKEN) {
  throw new Error('Missing Shopify credentials in environment variables');
}

const ACCEPTED_LOCATION_ID = '88278073611';

const shopifyClient = createAdminApiClient({
  storeDomain: process.env.SHOPIFY_URL,
  apiVersion: '2024-01',
  accessToken: process.env.SHOPIFY_TOKEN,
});

interface ShopifyResponse {
  orders: {
    nodes: Array<{
      id: string;
      name: string;
      createdAt: string;
      cancelledAt: string | null;
      displayFulfillmentStatus: string;
      displayFinancialStatus: string;
      note: string | null;
      totalPriceSet: {
        shopMoney: {
          amount: string;
          currencyCode: string;
        }
      };
      lineItems: {
        nodes: Array<{
          id: string;
          title: string;
          quantity: number;
          refundableQuantity: number;
          originalUnitPriceSet: {
            shopMoney: {
              amount: string;
            }
          };
          sku: string | null;
          variant: {
            id: string;
            title: string | null;
            metafields: {
              edges: Array<{
                node: {
                  namespace: string;
                  key: string;
                  value: string;
                  type: string;
                };
              }>;
            } | null;
            inventoryItem: {
              unitCost: {
                amount: string;
              };
              tracked: boolean;
              inventoryLevels: {
                edges: Array<{
                  node: {
                    location: {
                      id: string;
                    };
                  };
                }>;
              };
            };
          } | null;
          product: {
            vendor: string | null;
            id: string;
          } | null;
          requiresShipping: boolean;
          taxable: boolean;
          image: {
            url: string;
            altText: string | null;
          } | null;
        }>;
      };
    }>;
  };
}

export const fetchOrdersApiAction = async (): Promise<ShopifyOrder[]> => {
  try {
    console.log('🔍 Début de fetchOrdersApiAction');
    
    // Test d'abord la connexion
    await shopifyClient.request(TEST_QUERY);
    console.log('✅ Test de connexion réussi');

    // Afficher la requête qui va être envoyée
    console.log('📝 Requête GraphQL:', ORDERS_QUERY);

    // Si le test passe, on fait la vraie requête
    const result = await shopifyClient.request<ShopifyResponse>(ORDERS_QUERY);

    // Debug: afficher la réponse brute de Shopify
    console.log('\n🔍 RÉPONSE BRUTE DE SHOPIFY:', JSON.stringify(result.data, null, 2));

    if (result?.data?.orders?.nodes?.[0]) {
      const firstOrder = result.data.orders.nodes[0];
      console.log('\n🔍 PREMIÈRE COMMANDE:', firstOrder.name);
      
      firstOrder.lineItems.nodes.forEach(item => {
        console.log('\n📦 ARTICLE:', item.title);
        console.log('Variant:', item.variant?.title);
        console.log('Metafields bruts:', JSON.stringify(item.variant?.metafields, null, 2));
      });
    }

    if (!result?.data?.orders?.nodes) {
      return [];
    }

    
    // Transformer les données pour correspondre à notre type
    const orders = result.data.orders.nodes
      .map(order => {
        // Filtrer les articles pour ne garder que ceux de l'emplacement accepté
        const filteredLineItems = order.lineItems.nodes
          .filter(item => {
            // Debug: log des metafields pour chaque variant
            if (item.variant?.metafields) {
              console.log('📑 Metafields pour variant ' + item.variant.title + ':', 
                JSON.stringify(item.variant.metafields, null, 2));
            }

            // Exclure les pourboires qui sont des articles sans livraison et sans SKU
            const isTip = !item.requiresShipping && !item.sku && 
              (item.title.toLowerCase().includes('tip') || 
               item.title.toLowerCase().includes('pourboire'));
      
            return !isTip;
          });

        // Si aucun article n'est de l'emplacement accepté, retourner null
        if (filteredLineItems.length === 0) {
          return null;
        }

        // Retourner l'objet ShopifyOrder complet
        return {
          id: order.id,
          name: order.name,
          orderNumber: order.name.replace('#', ''),
          createdAt: order.createdAt,
          cancelledAt: order.cancelledAt,
          displayFulfillmentStatus: order.displayFulfillmentStatus,
          displayFinancialStatus: order.displayFinancialStatus,
          note: order.note || undefined,
          synced_at: new Date().toISOString(),
          totalPrice: order.totalPriceSet.shopMoney.amount,
          totalPriceCurrency: order.totalPriceSet.shopMoney.currencyCode,
          lineItems: filteredLineItems.map(item => ({
            id: item.id,
            title: item.title,
            quantity: item.quantity,
            refundableQuantity: item.refundableQuantity,
            price: item.originalUnitPriceSet.shopMoney.amount,
            sku: item.sku || getDefaultSku(item.title),
            variantTitle: item.variant?.title || null,
            vendor: item.product?.vendor || null,
            productId: item.product?.id || '',
            requiresShipping: item.requiresShipping,
            taxable: item.taxable,
            image: item.image || null,
            unitCost: item.variant?.inventoryItem?.unitCost?.amount ? parseFloat(item.variant.inventoryItem.unitCost.amount) : null,
            totalCost: item.variant?.inventoryItem?.unitCost?.amount ? parseFloat(item.variant.inventoryItem.unitCost.amount) * item.quantity : null,
            isCancelled: item.quantity > item.refundableQuantity,
            metafields: item.variant?.metafields?.edges.map(edge => ({
              namespace: edge.node.namespace,
              key: edge.node.key,
              value: edge.node.value,
              type: edge.node.type
            })) || []
          }))
        } as ShopifyOrder; // Assertion de type explicite
      })
      .filter((order): order is ShopifyOrder => order !== null); // Type guard pour TypeScript

    return orders;
  } catch (error) {
    throw new Error('Failed to fetch orders from Shopify. Please check your API credentials and try again.');
  }
};
