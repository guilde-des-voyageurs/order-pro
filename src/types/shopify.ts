export interface ShopifyOrder {
  id: string;
  name: string;
  createdAt: string;
  displayFulfillmentStatus: string;
  displayFinancialStatus: string;
  lineItems: {
    nodes: Array<{
      id: string;
      title: string;
      quantity: number;
      price: string;
      sku: string | null;
      variantTitle: string | null;
      vendor: string | null;
      productId: string | null;
      requiresShipping: boolean;
      taxable: boolean;
      giftCard: boolean;
    }>;
  };
}
