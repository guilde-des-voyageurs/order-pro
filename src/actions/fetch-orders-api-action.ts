'use server';

import { createAdminApiClient } from '@shopify/admin-api-client';
import type { ShopifyOrder } from '@/types/shopify';

if (!process.env.SHOPIFY_URL || !process.env.SHOPIFY_TOKEN) {
  throw new Error('Missing Shopify credentials in environment variables');
}

const shopifyClient = createAdminApiClient({
  storeDomain: process.env.SHOPIFY_URL,
  apiVersion: '2024-01',
  accessToken: process.env.SHOPIFY_TOKEN,
});

const query = `
query {
  orders(
    first: 100, 
    sortKey: CREATED_AT, 
    reverse: true,
    query: "created_at:>='2025-01-16' AND (financial_status:active OR financial_status:paid OR financial_status:partially_paid OR financial_status:partially_refunded OR financial_status:pending)"
  ) {
    nodes {
      id
      name
      createdAt
      displayFulfillmentStatus
      displayFinancialStatus
      totalPriceSet {
        shopMoney {
          amount
          currencyCode
        }
      }
      customer {
        firstName
        lastName
        email
      }
      shippingAddress {
        address1
        address2
        city
        zip
        countryCode
      }
      lineItems(first: 50) {
        nodes {
          id
          title
          quantity
          refundableQuantity
          originalUnitPriceSet {
            shopMoney {
              amount
            }
          }
          sku
          variant {
            title
            inventoryItem {
              unitCost {
                amount
              }
            }
          }
          product {
            vendor
            id
          }
          requiresShipping
          taxable
          image {
            url
            altText
          }
        }
      }
    }
  }
}`;

interface ShopifyResponse {
  orders: {
    nodes: Array<{
      id: string;
      name: string;
      createdAt: string;
      displayFulfillmentStatus: string;
      displayFinancialStatus: string;
      totalPriceSet: {
        shopMoney: {
          amount: string;
          currencyCode: string;
        }
      };
      customer?: {
        firstName: string;
        lastName: string;
        email: string;
      };
      shippingAddress?: {
        address1: string;
        address2?: string;
        city: string;
        zip: string;
        countryCode: string;
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
              }
            }
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
    await shopifyClient.request(testQuery);

    // Si le test passe, on fait la vraie requête
    const result = await shopifyClient.request<ShopifyResponse>(query);
    
    if (!result?.data?.orders?.nodes) {
      return [];
    }

    // Transformer les données pour correspondre à notre type
    const orders = result.data.orders.nodes.map(order => ({
      id: order.id,
      name: order.name,
      createdAt: order.createdAt,
      displayFulfillmentStatus: order.displayFulfillmentStatus,
      displayFinancialStatus: order.displayFinancialStatus,
      totalPrice: order.totalPriceSet.shopMoney.amount,
      totalPriceCurrency: order.totalPriceSet.shopMoney.currencyCode,
      customer: order.customer,
      shippingAddress: order.shippingAddress ? {
        ...order.shippingAddress,
        country: order.shippingAddress.countryCode
      } : undefined,
      lineItems: order.lineItems.nodes.map(item => ({
        id: item.id,
        title: item.title,
        quantity: item.quantity,
        refundableQuantity: item.refundableQuantity,
        price: item.originalUnitPriceSet.shopMoney.amount,
        sku: item.sku,
        variantTitle: item.variant?.title || null,
        vendor: item.product?.vendor || null,
        productId: item.product?.id || '',
        requiresShipping: item.requiresShipping,
        taxable: item.taxable,
        image: item.image || undefined,
        unitCost: parseFloat(item.variant?.inventoryItem?.unitCost?.amount || '0'),
        totalCost: parseFloat(item.variant?.inventoryItem?.unitCost?.amount || '0') * item.quantity,
        isCancelled: item.quantity > item.refundableQuantity
      }))
    }));

    return orders;
  } catch (error) {
    throw new Error('Failed to fetch orders from Shopify. Please check your API credentials and try again.');
  }
};
