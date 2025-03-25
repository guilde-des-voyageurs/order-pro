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
            title: string | null;
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
    // Test d'abord la connexion
    await shopifyClient.request(TEST_QUERY.toString());

    // Si le test passe, on fait la vraie requête
    const result = await shopifyClient.request<ShopifyResponse>(ORDERS_QUERY.toString());

    if (!result?.data?.orders?.nodes) {
      return [];
    }

    
    // Transformer les données pour correspondre à notre type
    const orders = result.data.orders.nodes
      .map(order => {
        // Filtrer les articles pour ne garder que ceux de l'emplacement accepté
        const filteredLineItems = order.lineItems.nodes
          .filter(item => {
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
          createdAt: order.createdAt,
          cancelledAt: order.cancelledAt,
          displayFulfillmentStatus: order.displayFulfillmentStatus,
          displayFinancialStatus: order.displayFinancialStatus,
          note: order.note || undefined,
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
            isCancelled: item.quantity > item.refundableQuantity
          }))
        } as ShopifyOrder; // Assertion de type explicite
      })
      .filter((order): order is ShopifyOrder => order !== null); // Type guard pour TypeScript

    return orders;
  } catch (error) {
    throw new Error('Failed to fetch orders from Shopify. Please check your API credentials and try again.');
  }
};
