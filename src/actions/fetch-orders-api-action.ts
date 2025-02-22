'use server';

import { createAdminApiClient } from '@shopify/admin-api-client';
import type { ShopifyApiOrder } from '@/types/shopify-api';
import { EXCLUDED_TAGS } from '@/config/excluded-tags';

if (!process.env.SHOPIFY_URL || !process.env.SHOPIFY_TOKEN) {
  throw new Error('Missing Shopify credentials in environment variables');
}

console.log('Shopify configuration:', {
  url: process.env.SHOPIFY_URL,
  tokenLength: process.env.SHOPIFY_TOKEN.length,
  locationId: process.env.SHOPIFY_PROVIDER_LOCATION_ID,
});

const shopifyClient = createAdminApiClient({
  storeDomain: process.env.SHOPIFY_URL,
  apiVersion: '2024-01',
  accessToken: process.env.SHOPIFY_TOKEN,
});

// Requête simple pour tester la connexion
const testQuery = `
query {
  shop {
    name
    primaryDomain {
      url
    }
  }
}`;

const query = `
query GetOrders {
  orders(first: 150, sortKey: CREATED_AT, reverse: true) {
    nodes {
      id
      name
      tags
      displayFulfillmentStatus
      displayFinancialStatus
      createdAt
      shippingAddress {
        id
        formattedArea
      }
      fulfillmentOrders(first: 5) {
        nodes {
          assignedLocation {
            location {
              id
              name
            }
          }
          lineItems(first: 50) {
            nodes {
              id
              totalQuantity
              lineItem {
                id
                title
                quantity
                price
                sku
                variantTitle
                vendor
                productId
                requiresShipping
                taxable
                giftCard
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
}`;

interface Result {
  data: {
    orders: {
      nodes: ShopifyApiOrder[];
    };
  };
}

export const fetchOrdersApiAction = async (): Promise<ShopifyApiOrder[]> => {
  console.log('Fetching orders from Shopify API...');

  try {
    // Test de connexion d'abord
    console.log('Testing Shopify connection...');
    const testResult = await shopifyClient.request(testQuery);
    console.log('Shop info:', testResult);

    // Si le test passe, on fait la vraie requête
    console.log('Fetching orders...');
    const result = await shopifyClient.request<Result>(query);
    
    if (!result?.data?.orders?.nodes) {
      console.warn('No orders data returned from Shopify API. Full response:', result);
      return [];
    }

    const orders = result.data.orders.nodes;
    console.log(`Found ${orders.length} orders before filtering`);

    const filteredOrders = orders.filter((order) => {
      const excluded = order.tags.some((tag) => EXCLUDED_TAGS.includes(tag as any));
      if (excluded) {
        console.log(`Order ${order.name} excluded due to tags:`, order.tags);
      }
      return !excluded;
    });

    console.log(`Found ${filteredOrders.length} orders after filtering`);
    if (filteredOrders.length > 0) {
      console.log('Sample order:', filteredOrders[0]);
    }

    return filteredOrders;
  } catch (error) {
    console.error('Error fetching orders from Shopify:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to fetch orders from Shopify: ${error.message}`);
    }
    throw new Error('Failed to fetch orders from Shopify. Please check your API credentials and try again.');
  }
};
