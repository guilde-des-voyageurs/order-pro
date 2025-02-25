import type { ShopifyOrder } from '@/types/shopify';
import type { OrderRecord } from '@/lib/supabase';

/**
 * Convertit une commande Shopify en format Supabase
 */
export function shopifyToSupabaseOrder(order: ShopifyOrder): Omit<OrderRecord, 'synced_at'> {
  return {
    id: order.id.split('/').pop() || order.id, // Extrait le numéro de l'ID Shopify
    name: order.name,
    created_at: order.createdAt,
    closed_at: order.closedAt,
    cancelled_at: order.cancelledAt,
    display_fulfillment_status: order.displayFulfillmentStatus,
    display_financial_status: order.displayFinancialStatus,
    note: order.note,
    total_price: order.totalPrice,
    total_price_currency: order.totalPriceCurrency,
    customer: order.customer ? {
      first_name: order.customer.firstName,
      last_name: order.customer.lastName,
      email: order.customer.email,
    } : null,
    shipping_address: order.shippingAddress ? {
      address1: order.shippingAddress.address1,
      address2: order.shippingAddress.address2,
      city: order.shippingAddress.city,
      zip: order.shippingAddress.zip,
      country: order.shippingAddress.country,
    } : null,
    line_items: order.lineItems.map(item => ({
      id: item.id,
      title: item.title,
      quantity: item.quantity,
      refundable_quantity: item.refundableQuantity,
      price: item.price,
      sku: item.sku,
      variant_title: item.variantTitle,
      vendor: item.vendor,
      product_id: item.productId,
      requires_shipping: item.requiresShipping,
      taxable: item.taxable,
      image: item.image,
      unit_cost: item.unitCost,
    })),
  };
}

/**
 * Convertit une commande Supabase en format Shopify
 */
export function supabaseToShopifyOrder(order: OrderRecord): ShopifyOrder {
  return {
    id: order.id,
    name: order.name,
    createdAt: order.created_at,
    closedAt: order.closed_at,
    cancelledAt: order.cancelled_at,
    displayFulfillmentStatus: order.display_fulfillment_status,
    displayFinancialStatus: order.display_financial_status,
    note: order.note,
    totalPrice: order.total_price,
    totalPriceCurrency: order.total_price_currency,
    customer: order.customer ? {
      firstName: order.customer.first_name,
      lastName: order.customer.last_name,
      email: order.customer.email,
    } : undefined,
    shippingAddress: order.shipping_address ? {
      address1: order.shipping_address.address1,
      address2: order.shipping_address.address2,
      city: order.shipping_address.city,
      zip: order.shipping_address.zip,
      country: order.shipping_address.country,
    } : undefined,
    lineItems: (order.line_items || []).map(item => ({
      id: item.id,
      title: item.title,
      quantity: item.quantity,
      refundableQuantity: item.refundable_quantity,
      price: item.price,
      sku: item.sku,
      variantTitle: item.variant_title,
      vendor: item.vendor,
      productId: item.product_id,
      requiresShipping: item.requires_shipping,
      taxable: item.taxable,
      image: item.image,
      unitCost: item.unit_cost,
    })),
  };
}
