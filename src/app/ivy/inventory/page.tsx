'use client';

import { useState, useEffect, useCallback } from 'react';
import { Title, Text, SimpleGrid, Loader, Center, TextInput, Group, Button, Paper, Stack, Badge } from '@mantine/core';
import { IconSearch, IconRefresh, IconUpload, IconDownload } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useShop } from '@/context/ShopContext';
import { useLocation } from '@/context/LocationContext';
import { ProductCard, ProductData, ProductDetailPanel } from '@/components/Inventory';
import styles from './inventory.module.scss';

export default function InventoryPage() {
  const { currentShop } = useShop();
  const { currentLocation } = useLocation();
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [pushing, setPushing] = useState(false);
  const [needsSync, setNeedsSync] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ProductData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
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
      setProducts(data.products || []);
      setNeedsSync(data.needsSync || false);
      
      // Trouver la date de dernière sync
      if (data.products?.length > 0) {
        const dates = data.products.map((p: any) => p.syncedAt).filter(Boolean);
        if (dates.length > 0) {
          setLastSyncedAt(dates.sort().reverse()[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Erreur lors du chargement des produits');
    } finally {
      setLoading(false);
    }
  }, [currentShop, currentLocation]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Synchroniser depuis Shopify
  const handleSyncFromShopify = async () => {
    if (!currentShop) return;

    setSyncing(true);
    try {
      const response = await fetch('/api/inventory/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId: currentShop.id,
          locationId: currentLocation?.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Sync failed');
      }

      notifications.show({
        title: 'Synchronisation réussie',
        message: `${data.stats.products} produits synchronisés`,
        color: 'green',
      });

      // Recharger les produits
      await fetchProducts();
    } catch (err: any) {
      console.error('Error syncing:', err);
      notifications.show({
        title: 'Erreur de synchronisation',
        message: err.message || 'Une erreur est survenue',
        color: 'red',
      });
    } finally {
      setSyncing(false);
    }
  };

  // Envoyer vers Shopify
  const handlePushToShopify = async () => {
    if (!currentShop || !currentLocation) {
      notifications.show({
        title: 'Emplacement requis',
        message: 'Veuillez sélectionner un emplacement pour envoyer les stocks',
        color: 'orange',
      });
      return;
    }

    setPushing(true);
    try {
      const response = await fetch('/api/inventory/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId: currentShop.id,
          locationId: currentLocation.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Push failed');
      }

      notifications.show({
        title: 'Envoi réussi',
        message: `${data.stats.updated} stocks mis à jour sur Shopify`,
        color: 'green',
      });
    } catch (err: any) {
      console.error('Error pushing:', err);
      notifications.show({
        title: 'Erreur d\'envoi',
        message: err.message || 'Une erreur est survenue',
        color: 'red',
      });
    } finally {
      setPushing(false);
    }
  };

  // Filtrer les produits par recherche
  const filteredProducts = products.filter(product =>
    product.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Affichage si besoin de sync initial
  if (!loading && needsSync && products.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <Title order={1}>Inventaire</Title>
        </div>

        <Center h={400}>
          <Paper p="xl" withBorder radius="md" style={{ maxWidth: 500, textAlign: 'center' }}>
            <Stack gap="md">
              <IconRefresh size={48} style={{ margin: '0 auto', opacity: 0.5 }} />
              <Title order={3}>Synchronisation requise</Title>
              <Text c="dimmed">
                Aucun produit en cache. Cliquez sur le bouton ci-dessous pour récupérer 
                vos produits depuis Shopify.
              </Text>
              <Button
                size="lg"
                color="green"
                leftSection={<IconDownload size={20} />}
                onClick={handleSyncFromShopify}
                loading={syncing}
              >
                Récupérer depuis Shopify
              </Button>
            </Stack>
          </Paper>
        </Center>
      </div>
    );
  }

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
        <Group justify="space-between" align="flex-start">
          <div>
            <Title order={1}>Inventaire</Title>
            <Group gap="xs" mt={4}>
              <Text c="dimmed" size="sm">
                {filteredProducts.length} produit{filteredProducts.length > 1 ? 's' : ''}
              </Text>
              {currentLocation && (
                <Badge variant="light" color="green" size="sm">
                  {currentLocation.name}
                </Badge>
              )}
              {lastSyncedAt && (
                <Text c="dimmed" size="xs">
                  • Sync: {new Date(lastSyncedAt).toLocaleString('fr-FR')}
                </Text>
              )}
            </Group>
          </div>

          <Group gap="xs">
            <Button
              variant="light"
              color="green"
              leftSection={<IconDownload size={16} />}
              onClick={handleSyncFromShopify}
              loading={syncing}
              size="sm"
            >
              {syncing ? 'Synchronisation...' : 'Récupérer'}
            </Button>
            <Button
              variant="light"
              color="blue"
              leftSection={<IconUpload size={16} />}
              onClick={handlePushToShopify}
              loading={pushing}
              disabled={!currentLocation || syncing}
              size="sm"
            >
              Envoyer
            </Button>
          </Group>
        </Group>
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
