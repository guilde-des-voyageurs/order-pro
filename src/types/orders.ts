export interface Order {
  id: string;
  orderNumber?: string;
  name: string;
  createdAt: string;
  displayFinancialStatus?: string;
  tags?: string[];
  lineItems: Array<{
    sku?: string;
    variantTitle?: string;
    quantity: number;
    variant?: {
      metafields?: Array<{
        namespace: string;
        key: string;
        value: string;
      }>;
    };
  }>;
}
