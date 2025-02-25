'use server';

import { createAdminApiClient } from '@shopify/admin-api-client';
import type { ShopifyOrder } from '@/types/shopify';
import { TEST_QUERY, ORDERS_QUERY } from '@/graphql/queries';
import { getDefaultSku } from '@/utils/variant-helpers';

if (!process.env.SHOPIFY_URL || !process.env.SHOPIFY_TOKEN) {
  throw new Error('Missing Shopify credentials in environment variables');
}

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
    await shopifyClient.request(TEST_QUERY.toString());

    // Si le test passe, on fait la vraie requête
    const result = await shopifyClient.request<ShopifyResponse>(ORDERS_QUERY.toString());
    
    if (!result?.data?.orders?.nodes) {
      return [];
    }

    // Transformer les données pour correspondre à notre type
    const orders = result.data.orders.nodes.map(order => ({
      id: order.id,
      name: order.name,
      createdAt: order.createdAt,
      cancelledAt: order.cancelledAt,
      displayFulfillmentStatus: order.displayFulfillmentStatus,
      displayFinancialStatus: order.displayFinancialStatus,
      note: order.note || undefined,
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
    }));

    return orders;
  } catch (error) {
    throw new Error('Failed to fetch orders from Shopify. Please check your API credentials and try again.');
  }
};
