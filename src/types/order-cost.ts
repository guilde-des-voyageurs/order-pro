export interface OrderCost {
  costs: Array<{ description: string; amount: number }>;
  handlingFee: number;
  balance: number;
  total?: number;
  updatedAt?: string;
}
