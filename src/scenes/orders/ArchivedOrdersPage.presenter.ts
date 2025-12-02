'use client';

import { useEffect, useState, useMemo } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/db';
import type { ShopifyOrder } from '@/types/shopify';

const ORDERS_COLLECTION = 'orders-v2';
const ORDERS_PER_PAGE = 30;

export function useArchivedOrdersPagePresenter() {
  const [isReversed, setIsReversed] = useState(false);
  const [orders, setOrders] = useState<ShopifyOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<ShopifyOrder | undefined>(undefined);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

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

  const archivedOrders = useMemo(() => {
    return orders.filter(order => {
      // Ne pas inclure les commandes remboursées
      if (order.displayFinancialStatus?.toLowerCase() === 'refunded') {
        return false;
      }

      // Inclure SEULEMENT les commandes expédiées (FULFILLED)
      const status = order.displayFulfillmentStatus?.toLowerCase();
      if (status !== 'fulfilled') {
        return false;
      }

      // Ne pas inclure les commandes avec une balise contenant 'batch'
      if (order.tags?.some(tag => tag.toLowerCase().includes('batch'))) {
        return false;
      }

      return true;
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

  const sortedArchivedOrders = useMemo(() => {
    return isReversed ? [...archivedOrders].reverse() : archivedOrders;
  }, [archivedOrders, isReversed]);

  const totalPages = Math.ceil(sortedArchivedOrders.length / ORDERS_PER_PAGE);

  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * ORDERS_PER_PAGE;
    const endIndex = startIndex + ORDERS_PER_PAGE;
    return sortedArchivedOrders.slice(startIndex, endIndex);
  }, [sortedArchivedOrders, currentPage]);

  const toggleOrder = () => {
    setIsReversed(prev => !prev);
    setCurrentPage(1); // Reset to first page when sorting changes
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return {
    archivedOrders: paginatedOrders,
    totalOrders: sortedArchivedOrders.length,
    currentPage,
    totalPages,
    isReversed,
    toggleOrder,
    handlePageChange,
    selectedOrder,
    isDrawerOpen,
    onSelectOrder,
    onCloseDrawer,
    isLoading,
  };
}
