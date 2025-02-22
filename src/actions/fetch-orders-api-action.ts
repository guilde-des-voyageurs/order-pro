'use server';

import { createAdminApiClient } from '@shopify/admin-api-client';
import type { ShopifyOrder } from '@/types/shopify';

console.log('Checking Shopify credentials...');
if (!process.env.SHOPIFY_URL || !process.env.SHOPIFY_TOKEN) {
  throw new Error('Missing Shopify credentials in environment variables');
}

console.log('Creating Shopify client with URL:', process.env.SHOPIFY_URL);
const shopifyClient = createAdminApiClient({
  storeDomain: process.env.SHOPIFY_URL,
  apiVersion: '2024-01',
  accessToken: process.env.SHOPIFY_TOKEN,
});

// Requête simplifiée pour tester
const query = `
query {
  orders(first: 10) {
    nodes {
      id
      name
      createdAt
    }
  }
}`;

interface Result {
  data: {
    orders: {
      nodes: ShopifyOrder[];
    };
  };
}

export const fetchOrdersApiAction = async (): Promise<ShopifyOrder[]> => {
  console.log('Starting fetchOrdersApiAction...');
  try {
    // Test d'abord la connexion
    const testQuery = `
      query {
        shop {
          name
          primaryDomain {
            url
          }
        }
      }
    `;
    console.log('Testing connection first...');
    const testResult = await shopifyClient.request(testQuery);
    console.log('Shop info:', testResult);

    // Si le test passe, on fait la vraie requête
    console.log('Making orders request to Shopify...');
    const result: Result = await shopifyClient.request(query);
    console.log('Got response from Shopify:', result);
    
    if (!result?.data?.orders?.nodes) {
      console.warn('No orders data returned from Shopify API');
      return [];
    }

    console.log(`Found ${result.data.orders.nodes.length} orders`);
    return result.data.orders.nodes;
  } catch (error) {
    console.error('Error fetching orders from Shopify:', error);
    throw new Error('Failed to fetch orders from Shopify. Please check your API credentials and try again.');
  }
};
