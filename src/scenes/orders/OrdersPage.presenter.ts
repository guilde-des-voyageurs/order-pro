'use client';

import { useEffect, useState, useMemo } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/db';
import type { ShopifyOrder } from '@/types/shopify';

const ORDERS_COLLECTION = 'orders-v2';

export function useOrdersPagePresenter() {
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
        console.log('Firebase data for order:', doc.id, data);
        return {
          ...data,
        };
      }) as ShopifyOrder[];
      
      console.log('All orders data:', ordersData);
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
    setSelectedOrder(order);  
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedOrder(undefined);
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
