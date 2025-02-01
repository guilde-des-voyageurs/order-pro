'use server';

import { shopifyClient } from '@/shopify/shopify-client';
import { OrderSummaryViewModel } from '@/view-model/order-summary-view-model';
import { OrderSummaryStatus } from '@/view-model/order-status-view-model';
import { format } from 'date-fns';
import { EXCLUDED_TAGS } from '@/config/excluded-tags';

const query = `
query {
    orders(first:100, reverse: true) {
        nodes {
            id
            name
            tags
            displayFulfillmentStatus
            createdAt
            shippingAddress {
                id
                formattedArea
            }
            fulfillmentOrders (first: 5) {
                nodes {
                    assignedLocation {
                        location {
                            id
                            name
                        }
                    }
                    lineItems (first: 50) {
                        nodes {
                            id
                            totalQuantity
                            lineItem {
                                product {
                                    productType
                                }
                            }
                        }
                    }
                    status
                }
            } 
        }
    }
}
`;

type Result = {
  orders: {
    nodes: Array<{
      id: string;
      name: string;
      tags: string[];
      displayFulfillmentStatus: string;
      createdAt: string;
      shippingAddress: {
        id: string;
        formattedArea: string;
      };
      fulfillmentOrders: {
        nodes: Array<{
          assignedLocation: {
            location: {
              id: string;
              name: string;
            };
          };
          lineItems: {
            nodes: Array<{
              id: string;
              totalQuantity: number;
              lineItem: {
                product: {
                  productType: string;
                };
              };
            }>;
          };
          status: string;
        }>;
      };
    }>;
  };
};

export const fetchOrdersSummaryAction =
  async (): Promise<OrderSummaryViewModel> => {
    const result = await shopifyClient.request<Result>(query);

    const orders = result.data!.orders.nodes;

    const entries = result
      .data!.orders.nodes
      // Filtrer les commandes qui ont des tags exclus
      .filter((order) => !order.tags.some((tag) => EXCLUDED_TAGS.includes(tag as any)))
      // Exclure les commandes non traitées et fermées
      .filter((order) => !(order.displayFulfillmentStatus === 'UNFULFILLED' && order.fulfillmentOrders.nodes.some(fo => fo.status === 'CLOSED')))
      .map(
        (order): OrderSummaryViewModel['data'][number] | null => {
          const relevantFullfillmentOrder = order.fulfillmentOrders.nodes.find(
            (order) =>
              order.assignedLocation.location.id ===
              process.env.SHOPIFY_PROVIDER_LOCATION_ID,
          );

          if (!relevantFullfillmentOrder) {
            return null;
          }

          return {
            id: order.id,
            name: order.name,
            status: relevantFullfillmentOrder.status as OrderSummaryStatus,
            displayFulfillmentStatus: order.displayFulfillmentStatus,
            createdAt: order.createdAt,
            createdAtFormatted: format(new Date(order.createdAt), 'dd/MM/yyyy'),
            quantity: relevantFullfillmentOrder.lineItems.nodes.reduce(
              (prev, curr) => prev + curr.totalQuantity,
              0,
            ),
            quantityPerType: relevantFullfillmentOrder.lineItems.nodes.reduce(
              (prev, curr) => {
                const type = curr.lineItem.product.productType;
                if (!prev[type]) {
                  prev[type] = 0;
                }
                prev[type] += curr.totalQuantity;
                return prev;
              },
              {} as Record<string, number>,
            ),
            textileOrdered: order.tags.includes('textile_ordered'),
            billingDone: order.tags.includes('billing_done'),
          };
        },
      )
      .filter((order) => order !== null);

    return {
      data: entries as OrderSummaryViewModel['data'],
    };
  };
