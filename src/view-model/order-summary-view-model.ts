import { OrderSummaryStatus } from '@/view-model/order-status-view-model';

export type OrderSummaryViewModel = {
  data: Array<{
    id: string;
    name: string;
    status: OrderSummaryStatus;
    displayFulfillmentStatus: string;
    displayFinancialStatus: string;
    createdAt: string;
    createdAtFormatted: string;
    quantity: number;
    quantityPerType: Record<string, number>;
    textileOrdered: boolean;
    billingDone: boolean;
  }>;
};
