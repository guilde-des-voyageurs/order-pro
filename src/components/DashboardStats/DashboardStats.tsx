'use client';

import { useState, useEffect } from 'react';
import { SimpleGrid, Card, Text, Group, RingProgress } from '@mantine/core';
import { IconPackage, IconTruck, IconAlertTriangle, IconX } from '@tabler/icons-react';
import { productsService } from '@/services/products';

interface ProductStats {
  totalProducts: number;
  totalVariants: number;
  lowStock: number;
  outOfStock: number;
}

export function DashboardStats() {
  const [stats, setStats] = useState<ProductStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await productsService.getProductStats();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch stats'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return <Text>Chargement des statistiques...</Text>;
  }

  if (error) {
    return <Text c="red">Erreur : {error.message}</Text>;
  }

  if (!stats) {
    return <Text>Aucune statistique disponible</Text>;
  }

  const lowStockPercentage = (stats.lowStock / stats.totalVariants) * 100;
  const outOfStockPercentage = (stats.outOfStock / stats.totalVariants) * 100;

  return (
    <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }}>
      <Card withBorder>
        <Group>
          <IconPackage size={32} />
          <div>
            <Text size="xs" c="dimmed">Total Produits</Text>
            <Text fw={500} size="lg">{stats.totalProducts}</Text>
          </div>
        </Group>
      </Card>

      <Card withBorder>
        <Group>
          <IconTruck size={32} />
          <div>
            <Text size="xs" c="dimmed">Total Variantes</Text>
            <Text fw={500} size="lg">{stats.totalVariants}</Text>
          </div>
        </Group>
      </Card>

      <Card withBorder>
        <Group>
          <RingProgress
            size={80}
            roundCaps
            thickness={8}
            sections={[{ value: lowStockPercentage, color: 'yellow' }]}
            label={
              <Center>
                <IconAlertTriangle size={22} color="yellow" />
              </Center>
            }
          />
          <div>
            <Text size="xs" c="dimmed">Stock Bas</Text>
            <Text fw={500} size="lg">{stats.lowStock}</Text>
            <Text size="xs" c="dimmed">({lowStockPercentage.toFixed(1)}%)</Text>
          </div>
        </Group>
      </Card>

      <Card withBorder>
        <Group>
          <RingProgress
            size={80}
            roundCaps
            thickness={8}
            sections={[{ value: outOfStockPercentage, color: 'red' }]}
            label={
              <Center>
                <IconX size={22} color="red" />
              </Center>
            }
          />
          <div>
            <Text size="xs" c="dimmed">Rupture de Stock</Text>
            <Text fw={500} size="lg">{stats.outOfStock}</Text>
            <Text size="xs" c="dimmed">({outOfStockPercentage.toFixed(1)}%)</Text>
          </div>
        </Group>
      </Card>
    </SimpleGrid>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {children}
    </div>
  );
}
