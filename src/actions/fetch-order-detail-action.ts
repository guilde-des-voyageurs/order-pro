'use server';

import { shopifyClient } from '@/shopify/shopify-client';
import { OrderDetailViewModel } from '@/view-model/order-detail-view-model';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ShopifyIds } from '@/utils/shopify-ids';

const query = `
query ($orderId: ID!) {
    order(id: $orderId) {
        id
        name
        createdAt
        displayFinancialStatus
        fulfillmentOrders (first: 3) {
            nodes {
                status
                assignedLocation {
                    location {
                        id
                    }
                }
                lineItems (first: 250) {
                    nodes {
                        image {
                            url
                        }
                        weight {
                            unit
                            value
                        }
                        lineItem {
                            product {
                                title
                                productType
                            }
                            quantity
                            refundableQuantity
                            variant {
                                sku
                                selectedOptions {
                                    name
                                    value
                                }
                                inventoryItem {
                                    unitCost {
                                        amount
                                    }
                                }
                            }
                            title
                        }
                    }
                }
            }
        }
    }
}
`;

type Result = {
  order: {
    id: string;
    name: string;
    createdAt: string;
    displayFinancialStatus: string;
    fulfillmentOrders: {
      nodes: Array<{
        status: string;
        assignedLocation: {
          location: {
            id: string;
          };
        };
        lineItems: {
          nodes: Array<{
            image: {
              url: string;
            } | null;
            weight: {
              unit: string;
              value: number;
            };
            lineItem: {
              product: {
                title: string;
                productType: string;
              };
              quantity: number;
              refundableQuantity: number;
              variant: {
                sku: string;
                selectedOptions: Array<{
                  name: string;
                  value: string;
                }>;
                inventoryItem: {
                  unitCost: {
                    amount: string;
                  };
                };
              };
              title: string;
            };
          }>;
        };
      }>;
    };
  };
};

export const fetchOrderDetailAction = async (
  id: string,
): Promise<OrderDetailViewModel> => {
  try {
    console.log('Fetching order details for ID:', id);

    const result = await shopifyClient.request<Result>(query, {
      variables: {
        orderId: id,
      },
    });

    console.log('Shopify result:', result);

    if (!result.data) {
      console.error('No data in result:', result);
      return {
        type: 'error',
        message: 'No data received from Shopify',
      };
    }

    const order = result.data.order;
    if (!order) {
      console.error('No order in data:', result.data);
      return {
        type: 'error',
        message: 'Order not found',
      };
    }

    const fulfillment = order.fulfillmentOrders.nodes.find(
      (order) =>
        order.assignedLocation.location.id ===
        process.env.SHOPIFY_PROVIDER_LOCATION_ID,
    );

    console.log('Found fulfillment:', fulfillment);
    console.log('Financial status:', order.displayFinancialStatus);

    // Si pas de fulfillment (commande en attente de paiement), on retourne quand même les infos de base
    if (!fulfillment) {
      return {
        type: 'success',
        data: {
          id: order.id,
          rawId: ShopifyIds.fromUri(order.id),
          name: order.name,
          status: 'OPEN',
          createdAt: order.createdAt,
          createdAtFormatted: format(new Date(order.createdAt), 'dd MMMM yyyy', {
            locale: fr,
          }),
          displayFinancialStatus: order.displayFinancialStatus,
          weightInKg: 0,
          products: [], // Array vide pour les commandes sans produits
        },
      };
    }

    // Filtrer les produits null ou undefined
    const validLineItems = fulfillment.lineItems.nodes
      .filter((node) => node && node.lineItem && node.lineItem.refundableQuantity > 0);

    return {
      type: 'success',
      data: {
        id: order.id,
        rawId: ShopifyIds.fromUri(order.id),
        name: order.name,
        status: fulfillment.status === 'CLOSED' ? 'CLOSED' : 'OPEN',
        createdAt: order.createdAt,
        createdAtFormatted: format(new Date(order.createdAt), 'dd MMMM yyyy', {
          locale: fr,
        }),
        displayFinancialStatus: order.displayFinancialStatus,
        weightInKg: validLineItems.reduce((acc, lineItem) => {
          if (lineItem.weight.unit === 'GRAMS') {
            return acc + lineItem.weight.value / 1000;
          } else {
            return acc + lineItem.weight.value;
          }
        }, 0),
        products: validLineItems.map((node) => ({
          id: node.lineItem.product.title,
          title: node.lineItem.title,
          imageUrl: node.image?.url ?? null,
          type: node.lineItem.product.productType,
          quantity: node.lineItem.refundableQuantity,
          weightInKg:
            node.weight.unit === 'GRAMS'
              ? node.weight.value / 1000
              : node.weight.value,
          selectedOptions: node.lineItem.variant?.selectedOptions || [],
          unitCostInEuros: parseFloat(
            node.lineItem.variant?.inventoryItem?.unitCost?.amount || '0',
          ),
          sku: node.lineItem.variant?.sku || 'N/A',
        })),
      },
    };
  } catch (error) {
    console.error('Error in fetchOrderDetailAction:', error);
    return {
      type: 'error',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};
