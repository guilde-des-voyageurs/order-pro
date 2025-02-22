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
  }>;
}
