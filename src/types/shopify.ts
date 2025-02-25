export interface ShopifyOrder {
  id: string;
  name: string;  // Le numéro de commande (ex: "#1404")
  createdAt: string;
  cancelledAt: string | null;
  displayFulfillmentStatus: string;
  displayFinancialStatus: string;
  totalPrice: string;
  totalPriceCurrency: string;
  note?: string;  // Notes de la commande
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
    country: string;
  };
  lineItems?: Array<{
    id: string;
    title: string;
    quantity: number;
    refundableQuantity: number;
    price: string;
    sku?: string;
    variantTitle?: string;
    vendor?: string;
    productId: string;
    requiresShipping: boolean;
    taxable: boolean;
    image?: string;
    unitCost?: number;
    totalCost?: number;
    isCancelled?: boolean;
  }>;
}
