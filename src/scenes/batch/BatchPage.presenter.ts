'use client';

import { useEffect, useState, useMemo } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/db';
import type { ShopifyOrder } from '@/types/shopify';

const ORDERS_COLLECTION = 'orders-v2';

export function useBatchPresenter() {
  const [isReversed, setIsReversed] = useState(false);
  const [orders, setOrders] = useState<ShopifyOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<ShopifyOrder | undefined>(undefined);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    const ordersRef = collection(db, ORDERS_COLLECTION);
    const q = query(
      ordersRef, 
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs
        .map(doc => ({
          ...doc.data(),
          id: doc.id
        })) as ShopifyOrder[];
      
      // Filtrer les commandes qui ont un tag contenant 'batch'
      const batchOrders = ordersData.filter(order => 
        order.tags?.some(tag => tag.toLowerCase().includes('batch'))
      );
      
      setOrders(batchOrders);
      setIsLoading(false);
    }, (error) => {
      console.error('Error fetching batch orders:', error);
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

  const orderStats = useMemo(() => {
    const now = new Date();
    const stats = {
      old: 0, // >14 jours
      medium: 0, // 7-14 jours
      recent: 0 // <7 jours
    };

    pendingOrders.forEach(order => {
      const orderDate = new Date(order.createdAt);
      const daysDiff = Math.floor((now.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff > 14) {
        stats.old++;
      } else if (daysDiff > 7) {
        stats.medium++;
      } else {
        stats.recent++;
      }
    });

    return stats;
  }, [pendingOrders]);

  const sortedPendingOrders = useMemo(() => {
    return isReversed ? [...pendingOrders].reverse() : pendingOrders;
  }, [pendingOrders, isReversed]);

  const toggleOrder = () => setIsReversed(prev => !prev);

  return {
    pendingOrders: sortedPendingOrders,
    orderStats,
    isReversed,
    toggleOrder,
    selectedOrder,
    isDrawerOpen,
    onSelectOrder,
    onCloseDrawer,
    isLoading
  };
}
