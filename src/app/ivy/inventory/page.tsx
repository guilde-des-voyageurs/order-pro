'use client';

import { useState, useEffect } from 'react';
import { Title, Text, SimpleGrid, Loader, Center, TextInput, Group } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import { useShop } from '@/context/ShopContext';
import { useLocation } from '@/context/LocationContext';
import { ProductCard, ProductData, ProductDetailPanel } from '@/components/Inventory';
import styles from './inventory.module.scss';

export default function InventoryPage() {
  const { currentShop } = useShop();
  const { currentLocation } = useLocation();
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ProductData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      if (!currentShop) return;

      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({ shopId: currentShop.id });
        if (currentLocation) {
          params.append('locationId', currentLocation.id);
        }

        const response = await fetch(`/api/products?${params}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }

        const data = await response.json();
        setProducts(data.products);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Erreur lors du chargement des produits');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [currentShop, currentLocation]);

  // Filtrer les produits par recherche
  const filteredProducts = products.filter(product =>
    product.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <Center h={400}>
        <Loader size="lg" color="green" />
      </Center>
    );
  }

  if (error) {
    return (
      <Center h={400}>
        <Text c="red">{error}</Text>
      </Center>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Title order={1}>Inventaire</Title>
        <Text c="dimmed" size="sm">
          {filteredProducts.length} produit{filteredProducts.length > 1 ? 's' : ''}
          {currentLocation && ` • ${currentLocation.name}`}
        </Text>
      </div>

      <Group mb="xl">
        <TextInput
          placeholder="Rechercher un produit..."
          leftSection={<IconSearch size={16} />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.currentTarget.value)}
          style={{ flex: 1, maxWidth: 400 }}
        />
      </Group>

      <SimpleGrid cols={{ base: 2, sm: 3, md: 4, lg: 5 }} spacing="md">
        {filteredProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onClick={() => setSelectedProduct(product)}
          />
        ))}
      </SimpleGrid>

      {filteredProducts.length === 0 && (
        <Center h={200}>
          <Text c="dimmed">Aucun produit trouvé</Text>
        </Center>
      )}

      {selectedProduct && (
        <ProductDetailPanel
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
}
