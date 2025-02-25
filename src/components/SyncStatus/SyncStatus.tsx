'use client';

import { Card, Group, Text, Button, Stack, Badge } from '@mantine/core';
import { IconRefresh, IconClock } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useSync } from '@/hooks/useSync';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export function SyncStatus() {
  const { syncStatus, lastSync, error, syncOrders, syncProducts } = useSync();

  const handleSync = async (type: 'orders' | 'products') => {
    try {
      if (type === 'orders') {
        await syncOrders();
      } else {
        await syncProducts();
      }
      notifications.show({
        title: 'Synchronisation lancée',
        message: `La synchronisation des ${type === 'orders' ? 'commandes' : 'produits'} a démarré`,
        color: 'blue',
      });
    } catch (err) {
      notifications.show({
        title: 'Erreur',
        message: `Impossible de démarrer la synchronisation des ${type === 'orders' ? 'commandes' : 'produits'}`,
        color: 'red',
      });
    }
  };

  if (error) {
    return <Text c="red">Erreur : {error.message}</Text>;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'syncing':
        return 'blue';
      case 'error':
        return 'red';
      default:
        return 'green';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'syncing':
        return 'En cours';
      case 'error':
        return 'Erreur';
      default:
        return 'Prêt';
    }
  };

  const formatLastSync = (date?: string) => {
    if (!date) return 'Jamais';
    return `Il y a ${formatDistanceToNow(new Date(date), { locale: fr })}`;
  };

  return (
    <Stack>
      <Card withBorder>
        <Stack>
          <Group justify="space-between">
            <Text fw={500} size="lg">Commandes</Text>
            <Badge color={getStatusColor(syncStatus.orders)}>
              {getStatusText(syncStatus.orders)}
            </Badge>
          </Group>

          <Group>
            <IconClock size={16} />
            <Text size="sm">Dernière synchronisation : {formatLastSync(lastSync.orders)}</Text>
          </Group>

          <Button
            leftSection={<IconRefresh size={16} />}
            onClick={() => handleSync('orders')}
            loading={syncStatus.orders === 'syncing'}
            disabled={syncStatus.orders === 'syncing'}
          >
            Synchroniser les commandes
          </Button>
        </Stack>
      </Card>

      <Card withBorder>
        <Stack>
          <Group justify="space-between">
            <Text fw={500} size="lg">Produits</Text>
            <Badge color={getStatusColor(syncStatus.products)}>
              {getStatusText(syncStatus.products)}
            </Badge>
          </Group>

          <Group>
            <IconClock size={16} />
            <Text size="sm">Dernière synchronisation : {formatLastSync(lastSync.products)}</Text>
          </Group>

          <Button
            leftSection={<IconRefresh size={16} />}
            onClick={() => handleSync('products')}
            loading={syncStatus.products === 'syncing'}
            disabled={syncStatus.products === 'syncing'}
          >
            Synchroniser les produits
          </Button>
        </Stack>
      </Card>
    </Stack>
  );
}
