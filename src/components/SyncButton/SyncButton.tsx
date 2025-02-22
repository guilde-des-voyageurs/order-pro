import { Button, Tooltip } from '@mantine/core';
import { IconRefresh } from '@tabler/icons-react';

export function SyncButton() {
  return (
    <Tooltip label="Synchroniser les commandes avec Shopify">
      <Button
        variant="light"
        size="compact-sm"
      >
        <IconRefresh size={16} />
      </Button>
    </Tooltip>
  );
}
