export interface ShopifyApiLineItem {
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
  product: {
    productType: string;
  };
}

export interface ShopifyApiOrder {
  id: string;
  name: string;
  tags: string[];
  displayFulfillmentStatus: string;
  displayFinancialStatus: string;
  createdAt: string;
  shippingAddress: {
    id: string;
    formattedArea: string;
  };
  fulfillmentOrders: {
    nodes: Array<{
      assignedLocation: {
        location: {
          id: string;
          name: string;
        };
      };
      lineItems: {
        nodes: Array<{
          id: string;
          totalQuantity: number;
          lineItem: ShopifyApiLineItem;
        }>;
      };
      status: string;
    }>;
  };
}
