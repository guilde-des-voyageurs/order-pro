import { BatchPresenterResult } from './BatchPage.types'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '@/firebase/db'
import type { ShopifyOrder } from '@/types/shopify'
import { useState, useEffect } from 'react'

export const useBatchPresenter = (): BatchPresenterResult => {
  const [orders, setOrders] = useState<ShopifyOrder[]>([])
  const [selectedOrder, setSelectedOrder] = useState<ShopifyOrder | undefined>()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | undefined>()

  useEffect(() => {
    const ordersRef = collection(db, 'orders-v2')
    const q = query(ordersRef, where('tags', 'array-contains', 'batch'))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs
        .map(doc => ({ ...doc.data(), id: doc.id }) as ShopifyOrder)
        .filter(order => order.displayFinancialStatus?.toLowerCase() !== 'refunded')

      setOrders(ordersData)
      setIsLoading(false)
    }, (error) => {
      console.error('Error fetching batch orders:', error)
      setError(error as Error)
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const handleOrderSelect = (id: string) => {
    const order = orders.find(o => o.id === id)
    setSelectedOrder(order)
  }

  return {
    isLoading,
    error,
    orders,
    selectedOrder,
    handleOrderSelect,
  }
}
