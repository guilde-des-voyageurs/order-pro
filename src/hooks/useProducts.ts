'use client';

import { useState, useEffect } from 'react';
import { db } from '@/firebase/config';
import { collection, query, where, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { notifications } from '@mantine/notifications';

interface Product {
  id: string;
  title: string;
  status: string;
  variants: Array<{
    id: string;
    title: string;
    sku: string;
    price: string;
    inventory: number;
  }>;
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Écouter les changements des produits dans Firestore
    const unsubscribe = onSnapshot(
      query(collection(db, 'products')),
      (snapshot) => {
        const productsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Product[];

        // Filtrer les produits si une recherche est active
        const filteredProducts = searchQuery
          ? productsData.filter(product =>
              product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              product.variants.some(variant =>
                variant.sku.toLowerCase().includes(searchQuery.toLowerCase())
              )
            )
          : productsData;

        setProducts(filteredProducts);
        setLoading(false);
      },
      (err) => {
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [searchQuery]);

  const updateInventory = async (productId: string, variantId: string, quantity: number) => {
    try {
      const productRef = doc(db, 'products', productId);
      const product = products.find(p => p.id === productId);
      
      if (!product) throw new Error('Product not found');

      const updatedVariants = product.variants.map(variant =>
        variant.id === variantId
          ? { ...variant, inventory: quantity }
          : variant
      );

      await updateDoc(productRef, { variants: updatedVariants });

      notifications.show({
        title: 'Succès',
        message: 'Stock mis à jour avec succès',
        color: 'green',
      });
    } catch (err) {
      setError(err as Error);
      notifications.show({
        title: 'Erreur',
        message: 'Impossible de mettre à jour le stock',
        color: 'red',
      });
      throw err;
    }
  };

  return {
    products,
    isLoading: loading,
    error,
    searchQuery,
    setSearchQuery,
    updateInventory,
  };
}
