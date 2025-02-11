import { OrderSummaryStatus } from '@/view-model/order-status-view-model';

export type OrderDetailViewModel =
  | {
      type: 'error';
      message: string;
    }
  | {
      type: 'success';
      data: {
        id: string;
        rawId: string;
        name: string;
        status: OrderSummaryStatus;
        createdAt: string;
        createdAtFormatted: string;
        weightInKg: number;
        products: Array<{
          id: string;
          title: string;
          imageUrl: string | null;
          type: string;
          quantity: number;
          selectedOptions: Array<{
            name: string;
            value: string;
          }>;
          unitCostInEuros: number;
          weightInKg: number;
          sku: string;
        }>;
      };
    };
