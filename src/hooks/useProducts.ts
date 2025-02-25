'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { productsService } from '@/services/products';

export function useProducts(initialQuery: string = '') {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [searchQuery, setSearchQuery] = useState(initialQuery);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const data = searchQuery
          ? await productsService.searchProducts(searchQuery)
          : await productsService.getProducts();
        setProducts(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch products'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();

    // Subscribe to changes
    const productsSubscription = supabase
      .channel('products_channel')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products'
        },
        () => {
          fetchProducts();
        }
      )
      .subscribe();

    return () => {
      productsSubscription.unsubscribe();
    };
  }, [searchQuery]);

  const updateInventory = async (productId: string, variantId: string, quantity: number) => {
    try {
      await productsService.updateInventory(productId, variantId, quantity);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update inventory'));
      throw err;
    }
  };

  return {
    products,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    updateInventory,
  };
}
