'use client';

import { useEffect, useState, useMemo } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/db';
import type { ShopifyOrder } from '@/types/shopify';

export function useOrdersPagePresenter() {
  const [orders, setOrders] = useState<ShopifyOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<ShopifyOrder | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        ...doc.data(),
      })) as ShopifyOrder[];
      
      setOrders(ordersData);
      setIsLoading(false);
    }, (error) => {
      console.error('Error fetching orders:', error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const { pendingOrders, shippedOrders } = useMemo(() => {
    return orders.reduce((acc, order) => {
      const status = order.displayFulfillmentStatus?.toLowerCase();
      if (status === 'fulfilled') {
        acc.shippedOrders.push(order);
      } else {
        acc.pendingOrders.push(order);
      }
      return acc;
    }, {
      pendingOrders: [] as ShopifyOrder[],
      shippedOrders: [] as ShopifyOrder[],
    });
  }, [orders]);

  const handleSelectOrder = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    setSelectedOrder(order || null);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedOrder(null);  // Remettre à null pour forcer le useEffect à se relancer
  };

  return {
    pendingOrders,
    shippedOrders,
    selectedOrder,
    isDrawerOpen,
    onSelectOrder: handleSelectOrder,
    onCloseDrawer: handleCloseDrawer,
    isLoading,
  };
}
