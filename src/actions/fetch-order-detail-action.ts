'use server';

import { shopifyClient } from '@/shopify/shopify-client';
import { OrderDetailViewModel } from '@/view-model/order-detail-view-model';
import { format } from 'date-fns';
import { ShopifyIds } from '@/utils/shopify-ids';

const query = `
query ($orderId: ID!) {
    order(id: $orderId) {
        id
        name
        createdAt
        fulfillmentOrders (first: 3) {
            nodes {
                status
                assignedLocation {
                    location {
                        id
                    }
                }
                lineItems (first: 10) {
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
                            variant {
                                selectedOptions {
                                    name
                                    value
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
              variant: {
                selectedOptions: Array<{
                  name: string;
                  value: string;
                }>;
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
  const result = await shopifyClient.request<Result>(query, {
    variables: {
      orderId: id,
    },
  });

  const fulfillment = result.data!.order.fulfillmentOrders.nodes.find(
    (order) =>
      order.assignedLocation.location.id ===
      process.env.SHOPIFY_PROVIDER_LOCATION_ID,
  );

  if (!fulfillment) {
    return {
      type: 'error',
      message: 'No fulfillment order found',
    };
  }

  const order = result.data!.order;

  return {
    type: 'success',
    data: {
      id: order.id,
      rawId: ShopifyIds.fromUri(order.id),
      name: order.name,
      status: fulfillment.status === 'CLOSED' ? 'CLOSED' : 'OPEN',
      createdAt: order.createdAt,
      createdAtFormatted: format(new Date(order.createdAt), 'dd-MM-yyyy'),
      weightInKg: fulfillment.lineItems.nodes.reduce((acc, lineItem) => {
        if (lineItem.weight.unit === 'GRAMS') {
          return acc + lineItem.weight.value / 1000;
        } else {
          return acc + lineItem.weight.value;
        }
      }, 0),
      products: fulfillment.lineItems.nodes.map((node) => ({
        id: node.lineItem.product.title,
        title: node.lineItem.title,
        imageUrl: node.image?.url ?? null,
        type: node.lineItem.product.productType,
        quantity: node.lineItem.quantity,
        selectedOptions: node.lineItem.variant.selectedOptions,
      })),
    },
  };
};
