import type { ShopifyOrder } from '@/types/shopify'

export interface BatchPresenterResult {
  isLoading: boolean
  error?: Error
  orders: ShopifyOrder[]
  selectedOrder?: ShopifyOrder
  handleOrderSelect: (id: string) => void
}
