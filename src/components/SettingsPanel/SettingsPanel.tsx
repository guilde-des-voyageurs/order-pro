'use client';

import { Card, Stack, Group, Text, NumberInput, Switch, Select, Button } from '@mantine/core';
import { useSettings } from '@/hooks/useSettings';
import { notifications } from '@mantine/notifications';

export function SettingsPanel() {
  const { settings, isLoading, error, updateSettings } = useSettings();

  if (isLoading) {
    return <Text>Chargement des paramètres...</Text>;
  }

  if (error) {
    return <Text c="red">Erreur : {error.message}</Text>;
  }

  if (!settings) {
    return <Text>Aucun paramètre trouvé</Text>;
  }

  const handleSyncConfigUpdate = async (field: string, value: number | boolean) => {
    try {
      await updateSettings({
        sync_config: {
          ...settings.sync_config,
          [field]: value,
        },
      });
      notifications.show({
        title: 'Succès',
        message: 'Paramètres de synchronisation mis à jour',
        color: 'green',
      });
    } catch (err) {
      notifications.show({
        title: 'Erreur',
        message: 'Impossible de mettre à jour les paramètres',
        color: 'red',
      });
    }
  };

  const handleDisplayConfigUpdate = async (field: string, value: string | number) => {
    try {
      await updateSettings({
        display_config: {
          ...settings.display_config,
          [field]: value,
        },
      });
      notifications.show({
        title: 'Succès',
        message: 'Paramètres d\'affichage mis à jour',
        color: 'green',
      });
    } catch (err) {
      notifications.show({
        title: 'Erreur',
        message: 'Impossible de mettre à jour les paramètres',
        color: 'red',
      });
    }
  };

  return (
    <Stack gap="xl">
      <Card withBorder>
        <Stack>
          <Text fw={500} size="lg">Synchronisation</Text>
          
          <Group align="center">
            <Switch
              label="Activer la synchronisation automatique"
              checked={settings.sync_config.enabled}
              onChange={(event) => handleSyncConfigUpdate('enabled', event.currentTarget.checked)}
            />
          </Group>

          <NumberInput
            label="Intervalle de synchronisation des commandes (minutes)"
            value={settings.sync_config.orders_sync_interval_minutes}
            onChange={(value) => handleSyncConfigUpdate('orders_sync_interval_minutes', value || 15)}
            min={5}
            max={60}
          />

          <NumberInput
            label="Intervalle de synchronisation des produits (minutes)"
            value={settings.sync_config.products_sync_interval_minutes}
            onChange={(value) => handleSyncConfigUpdate('products_sync_interval_minutes', value || 60)}
            min={15}
            max={120}
          />

          <NumberInput
            label="Nombre maximum d'éléments par synchronisation"
            value={settings.sync_config.max_items_per_sync}
            onChange={(value) => handleSyncConfigUpdate('max_items_per_sync', value || 100)}
            min={10}
            max={500}
          />
        </Stack>
      </Card>

      <Card withBorder>
        <Stack>
          <Text fw={500} size="lg">Affichage</Text>

          <Select
            label="Devise par défaut"
            value={settings.display_config.default_currency}
            onChange={(value) => handleDisplayConfigUpdate('default_currency', value || 'EUR')}
            data={[
              { value: 'EUR', label: 'Euro (€)' },
              { value: 'USD', label: 'Dollar ($)' },
              { value: 'GBP', label: 'Livre (£)' },
            ]}
          />

          <Select
            label="Format de date"
            value={settings.display_config.date_format}
            onChange={(value) => handleDisplayConfigUpdate('date_format', value || 'DD/MM/YYYY')}
            data={[
              { value: 'DD/MM/YYYY', label: 'JJ/MM/AAAA' },
              { value: 'MM/DD/YYYY', label: 'MM/JJ/AAAA' },
              { value: 'YYYY-MM-DD', label: 'AAAA-MM-JJ' },
            ]}
          />

          <NumberInput
            label="Éléments par page"
            value={settings.display_config.items_per_page}
            onChange={(value) => handleDisplayConfigUpdate('items_per_page', value || 25)}
            min={10}
            max={100}
          />
        </Stack>
      </Card>
    </Stack>
  );
}
