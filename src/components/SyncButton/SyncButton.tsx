import { Button, Tooltip } from '@mantine/core';
import { IconRefresh } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useState, useEffect } from 'react';
import { fetchOrdersApiAction } from '@/actions/fetch-orders-api-action';
import { ordersService } from '@/firebase/services/orders';

export function SyncButton() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasInitialSync, setHasInitialSync] = useState(false);

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      const orders = await fetchOrdersApiAction();
      await ordersService.syncOrders(orders);

      notifications.show({
        title: 'Synchronisation réussie',
        message: `${orders.length} commandes synchronisées (avec notes)`,
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'Erreur de synchronisation',
        message: error instanceof Error ? error.message : 'Une erreur est survenue',
        color: 'red',
      });
    } finally {
      setIsSyncing(false);
      setHasInitialSync(true);
    }
  };

  useEffect(() => {
    if (!hasInitialSync) {
      handleSync();
    }
  }, []);

  return (
    <Tooltip label="Synchroniser les commandes">
      <Button
        variant="light"
        onClick={handleSync}
        loading={isSyncing}
        leftSection={<IconRefresh size={16} />}
      >
        Synchroniser
      </Button>
    </Tooltip>
  );
}
