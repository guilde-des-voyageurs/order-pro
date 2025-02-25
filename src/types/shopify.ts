export interface ShopifyOrder {
  id: string;
  name: string;  // Le numéro de commande (ex: "#1404")
  createdAt: string;
  cancelledAt: string | null;
  displayFulfillmentStatus: string;
  displayFinancialStatus: string;
  totalPrice: string;
  totalPriceCurrency: string;
  note?: string | null;  // Notes de la commande
  customer?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  shippingAddress?: {
    address1: string;
    address2?: string | null;
    city: string;
    zip: string;
    country: string;
  };
  lineItems?: Array<{
    id: string;
    title: string;
    quantity: number;
    refundableQuantity: number;
    price: string;
    sku?: string | null;
    variantTitle?: string | null;
    vendor?: string | null;
    productId: string;
    requiresShipping: boolean;
    taxable: boolean;
    image?: {
      url: string;
      altText: string | null;
    } | null;
    unitCost?: number | null;
    totalCost?: number | null;
    isCancelled?: boolean | null;
  }>;
}
