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
  apiVersion: '2024-10',
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
      tags: string[];
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
    console.log('📡 Test de connexion à l’API Shopify...');
    // Test la connexion avant de faire la requête
    await shopifyClient.request(TEST_QUERY);
    console.log('✅ Connexion établie');
    
    console.log('📥 Récupération des commandes...');
    // Faire la requête principale
    const result = await shopifyClient.request<ShopifyResponse>(ORDERS_QUERY);
    console.log('✅ Requête réussie');
    
    if (!result?.data?.orders?.nodes) {
      console.log('❌ Aucune commande reçue de Shopify');
      return [];
    }

    console.log(`💶 Nombre total de commandes reçues : ${result.data.orders.nodes.length}`);
    console.log('💶 Première commande reçue :', {
      name: result.data.orders.nodes[0]?.name,
      status: result.data.orders.nodes[0]?.displayFinancialStatus
    });

    // Log des 2 dernières commandes (sauf #1465)
    const lastTwoOrders = (result?.data?.orders?.nodes || [])
      .slice(-2)
      .filter(order => order.name !== '#1465');
    console.log('💶 Données des 2 dernières commandes :', lastTwoOrders.map(order => ({
      name: order.name,
      tags: order.tags
    })));

    if (!result?.data?.orders?.nodes) {
      return [];
    }

    
    // Transformer les données pour correspondre à notre type
    const orders = result.data.orders.nodes
      .map(order => {
        // Ne logger que les 2 dernières commandes
        if (lastTwoOrders.find(o => o.id === order.id)) {
          console.log(`📌 Détails de la commande ${order.name}:`, {
            tags: order.tags,
            lineItems: order.lineItems.nodes.map(item => ({
              title: item.title,
              sku: item.sku,
              quantity: item.quantity,
              price: item.originalUnitPriceSet.shopMoney.amount
            }))
          });
        }

        // Filtrer les articles pour ne garder que ceux de l'emplacement accepté
        const filteredLineItems = order.lineItems.nodes
          .filter(item => {
            // Vérifier si le variant existe

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
        const transformedOrder = {
          id: order.id,
          name: order.name,
          orderNumber: order.name.replace('#', ''),
          createdAt: order.createdAt,
          cancelledAt: order.cancelledAt,
          displayFulfillmentStatus: order.displayFulfillmentStatus,
          displayFinancialStatus: order.displayFinancialStatus,
          note: order.note || undefined,
          tags: order.tags || [],
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
            variant: {
              id: item.variant?.id || '',
              title: item.variant?.title || '',
              metafields: item.variant?.metafields?.edges.map(edge => ({
                namespace: edge.node.namespace,
                key: edge.node.key,
                value: edge.node.value,
                type: edge.node.type
              })) || []
            }
          }))
        } as ShopifyOrder;

        // Ne logger que les 2 dernières commandes
        if (lastTwoOrders.find(o => o.id === order.id)) {
          console.log(`💾 Commande transformée ${order.name}:`, {
            tags: transformedOrder.tags,
            lineItems: transformedOrder.lineItems?.map(item => ({
              title: item.title,
              sku: item.sku,
              quantity: item.quantity,
              price: item.price,
              isCancelled: item.isCancelled
            }))
          });
        }

        return transformedOrder;
      })
      .filter((order): order is ShopifyOrder => order !== null);

    return orders;
  } catch (error) {
    throw new Error('Failed to fetch orders from Shopify. Please check your API credentials and try again.');
  }
};
