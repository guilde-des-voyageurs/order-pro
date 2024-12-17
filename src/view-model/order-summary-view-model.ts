type OrderSummaryStatus = 'OPEN' | 'CLOSED';

export type OrderSummaryViewModel = {
  id: string;
  name: string;
  status: OrderSummaryStatus;
  createdAt: string;
  createdAtFormatted: string;
  quantity: number;
};
