import { BatchPresenterResult } from './BatchPage.types'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '@/firebase/db'
import type { ShopifyOrder } from '@/types/shopify'
import { useState, useEffect } from 'react'

export const useBatchPresenter = (): BatchPresenterResult => {
  const [batchOrders, setBatchOrders] = useState<ShopifyOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const ordersRef = collection(db, 'orders-v2')
    const q = query(ordersRef, where('tags', 'array-contains', 'batch'))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs
        .map(doc => ({ ...doc.data(), id: doc.id }) as ShopifyOrder)
        .filter(order => order.displayFinancialStatus?.toLowerCase() !== 'refunded')

      setBatchOrders(ordersData)
      setIsLoading(false)
    }, (error) => {
      console.error('Error fetching batch orders:', error)
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [])

  return {
    batchOrders,
    isLoading,
  }
}
