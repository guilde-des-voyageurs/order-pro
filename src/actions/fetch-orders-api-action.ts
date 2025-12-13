'use server';

import { createAdminApiClient } from '@shopify/admin-api-client';
import type { ShopifyOrder } from '@/types/shopify';
import { TEST_QUERY, ORDERS_QUERY, ORDERS_QUERY_PAGINATED } from '@/graphql/queries';
import { getDefaultSku } from '@/utils/variant-helpers';

const getShopifyCredentials = () => {
  if (!process.env.SHOPIFY_URL || !process.env.SHOPIFY_TOKEN) {
    throw new Error('Missing Shopify credentials in environment variables');
  }
  return {
    url: process.env.SHOPIFY_URL,
    token: process.env.SHOPIFY_TOKEN,
  };
};

const ACCEPTED_LOCATION_ID = '88278073611';

const getShopifyClient = () => {
  const { url, token } = getShopifyCredentials();
  return createAdminApiClient({
    storeDomain: url,
    apiVersion: '2024-10',
    accessToken: token,
  });
};

interface ShopifyResponse {
  orders: {
    pageInfo: {
      hasNextPage: boolean;
      endCursor: string | null;
    };
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
            selectedOptions?: Array<{
              name: string;
              value: string;
            }> | null;
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
  const shopifyClient = getShopifyClient();
  try {
    console.log('Test de connexion a API Shopify...');
    await shopifyClient.request(TEST_QUERY);
    console.log('Connexion etablie');
    
    console.log('📥 Récupération des commandes avec pagination...');
    
    let allOrders: ShopifyOrder[] = [];
    let hasNextPage = true;
    let cursor: string | null = null;
    let pageNumber = 1;
    
    // Boucle de pagination
    while (hasNextPage) {
      console.log(`📄 Page ${pageNumber}...`);
      
      // Faire la requête (première page ou page suivante)
      const query: string = cursor ? ORDERS_QUERY_PAGINATED(cursor) : ORDERS_QUERY;
      const result: { data?: ShopifyResponse } = await shopifyClient.request<ShopifyResponse>(query);
      
      if (!result?.data?.orders?.nodes) {
        console.log('❌ Aucune commande reçue de Shopify');
        break;
      }

      console.log(`✅ Page ${pageNumber} : ${result.data.orders.nodes.length} commandes`);
      
      // Log des 2 dernières commandes de la première page (sauf #1465)
      const lastTwoOrders = pageNumber === 1 
        ? result.data.orders.nodes.slice(-2).filter(order => order.name !== '#1465')
        : [];
      
      if (pageNumber === 1 && lastTwoOrders.length > 0) {
        console.log('💶 Données des 2 dernières commandes :', lastTwoOrders.map(order => ({
          name: order.name,
          tags: order.tags
        })));
      }
      
      // Transformer les données pour correspondre à notre type
      const orders = result.data.orders.nodes
      .map(order => {
        // Ne logger que les 2 dernières commandes de la première page
        if (pageNumber === 1 && lastTwoOrders.find(o => o.id === order.id)) {
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
              selectedOptions: item.variant?.selectedOptions || [],
              metafields: item.variant?.metafields?.edges.map(edge => ({
                namespace: edge.node.namespace,
                key: edge.node.key,
                value: edge.node.value,
                type: edge.node.type
              })) || []
            }
          }))
        } as ShopifyOrder;

        // Ne logger que les 2 dernières commandes de la première page
        if (pageNumber === 1 && lastTwoOrders.find(o => o.id === order.id)) {
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

      // Ajouter les commandes de cette page au tableau global
      allOrders = allOrders.concat(orders);
      
      // Vérifier s'il y a une page suivante
      hasNextPage = result.data.orders.pageInfo.hasNextPage;
      cursor = result.data.orders.pageInfo.endCursor;
      
      if (hasNextPage && cursor) {
        console.log(`➡️  Il y a d'autres commandes, récupération de la page suivante...`);
        pageNumber++;
      } else {
        console.log(`✅ Toutes les commandes ont été récupérées (${allOrders.length} au total)`);
      }
    }

    return allOrders;
  } catch (error) {
    console.error('❌ Erreur lors de la synchronisation:', error);
    throw new Error('Failed to fetch orders from Shopify. Please check your API credentials and try again.');
  }
};
