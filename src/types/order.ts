export interface Order {
  id: string;
  name: string;  // Le numéro de commande
  createdAt: string;
  displayFinancialStatus?: string;
  tags?: string[];
  lineItems: Array<{
    quantity: number;
    unitCost?: number | null;
    total: number | null;
    sku?: string;
    variantTitle?: string;
    variant?: {
      metafields?: Array<{
        namespace: string;
        key: string;
        value: string;
      }>;
    };
  }>;
}
