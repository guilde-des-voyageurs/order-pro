'use server';

import { shopifyClient } from '@/shopify/shopify-client';
import { OrderSummaryViewModel } from '@/view-model/order-summary-view-model';
import { format } from 'date-fns';

const query = `
query {
    orders(first:30, reverse: true) {
        nodes {
            id
            name
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
                    lineItems (first: 10) {
                        nodes {
                            id
                            totalQuantity
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

    const entries = result
      .data!.orders.nodes.map(
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
            status:
              relevantFullfillmentOrder.status === 'OPEN' ? 'OPEN' : 'CLOSED',
            createdAt: order.createdAt,
            createdAtFormatted: format(new Date(order.createdAt), 'dd-MM-yyyy'),
            quantity: relevantFullfillmentOrder.lineItems.nodes.reduce(
              (acc, lineItem) => acc + lineItem.totalQuantity,
              0,
            ),
          };
        },
      )
      .filter((order) => order !== null);

    return {
      data: entries as OrderSummaryViewModel['data'],
    };
  };
