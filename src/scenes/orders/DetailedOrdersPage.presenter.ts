'use client';

import { useEffect, useState, useMemo } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/db';
import type { ShopifyOrder } from '@/types/shopify';

const ORDERS_COLLECTION = 'orders-v2';

export function useDetailedOrdersPagePresenter() {
  const [orders, setOrders] = useState<ShopifyOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<ShopifyOrder | undefined>(undefined);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    const ordersRef = collection(db, ORDERS_COLLECTION);
    const q = query(ordersRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
        };
      }) as ShopifyOrder[];
      
      setOrders(ordersData);
      setIsLoading(false);
    }, (error) => {
      console.error('Error fetching orders:', error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const pendingOrders = useMemo(() => {
    return orders.filter(order => {
      // Ne pas inclure les commandes remboursées
      if (order.displayFinancialStatus?.toLowerCase() === 'refunded') {
        return false;
      }

      // Ne pas inclure les commandes expédiées
      const status = order.displayFulfillmentStatus?.toLowerCase();
      return status !== 'fulfilled';
    });
  }, [orders]);

  const onSelectOrder = (id: string) => {
    const order = orders.find(o => o.id === id);
    setSelectedOrder(order);
    setIsDrawerOpen(true);
  };

  const onCloseDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedOrder(undefined);
  };

  return {
    pendingOrders,

    selectedOrder,
    isDrawerOpen,
    onSelectOrder,
    onCloseDrawer,
    isLoading,
  };
}
