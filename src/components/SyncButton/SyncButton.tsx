import { Button, Tooltip } from '@mantine/core';
import { IconRefresh } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useState, useEffect } from 'react';
import { fetchOrdersApiAction } from '@/actions/fetch-orders-api-action';
import { ordersService } from '@/firebase/services/orders';
import { useHasMounted } from '@/hooks/useHasMounted';

export function SyncButton() {
  const [isSyncing, setIsSyncing] = useState(false);
  const hasMounted = useHasMounted();

  const handleSync = async () => {
    console.log('Starting sync...');
    try {
      setIsSyncing(true);
      
      // Récupérer les commandes de Shopify
      console.log('Fetching orders...');
      const orders = await fetchOrdersApiAction();
      console.log('Orders fetched:', orders);
      
      // Synchroniser avec Firebase
      console.log('Syncing with Firebase...');
      await ordersService.syncOrders(orders);
      console.log('Sync complete!');

      notifications.show({
        title: 'Synchronisation réussie',
        message: `${orders.length} commandes synchronisées`,
        color: 'green',
      });
    } catch (error) {
      console.error('Error syncing orders:', error);
      notifications.show({
        title: 'Erreur de synchronisation',
        message: error instanceof Error ? error.message : 'Une erreur est survenue',
        color: 'red',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Synchroniser au chargement de la page
  useEffect(() => {
    if (!hasMounted) return;
    handleSync();
  }, [hasMounted]);

  return (
    <Tooltip label="Synchroniser les commandes avec Shopify">
      <Button
        variant="light"
        size="compact-sm"
        onClick={handleSync}
        loading={isSyncing}
      >
        <IconRefresh size={16} />
      </Button>
    </Tooltip>
  );
}
