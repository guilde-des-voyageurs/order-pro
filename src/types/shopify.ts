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
  tags: string[];  // Tags de la commande
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
    variant?: {
      id: string;
      title: string;
      sku?: string | null;
      metafields: Array<{
        namespace: string;
        key: string;
        value: string;
        type: string;
      }>;
    };
  }>;
}
