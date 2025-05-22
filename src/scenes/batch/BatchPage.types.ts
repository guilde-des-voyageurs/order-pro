import type { ShopifyOrder } from '@/types/shopify'

export interface BatchPageProps {}

export interface BatchPresenterResult {
  batchOrders: ShopifyOrder[]
  isLoading: boolean
}
