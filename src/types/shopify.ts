export interface ShopifyOrder {
  id: string;
  name: string;
  createdAt: string;
  displayFulfillmentStatus: string;
  displayFinancialStatus: string;
  totalPrice: string;
  totalPriceCurrency: string;
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
    sku: string | null;
    variantTitle: string | null;
    vendor: string | null;
    productId: string;
    requiresShipping: boolean;
    taxable: boolean;
    image?: {
      url: string;
      altText: string | null;
    };
    isCancelled?: boolean;
    unitCost: number;
    totalCost: number;
  }>;
}
