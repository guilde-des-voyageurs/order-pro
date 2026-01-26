'use client';

import { useState, useEffect, useCallback } from 'react';
import { Title, Text, Paper, Stack, TextInput, Button, Group, ActionIcon, Badge, Loader, Center } from '@mantine/core';
import { IconPlus, IconTrash, IconMapPin } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useShop } from '@/context/ShopContext';

interface Location {
  id: string;
  name: string;
}

interface OrderSettings {
  printer_notes: string[];
  sync_location_ids: string[];
}

export default function CommandesSettingsPage() {
  const { currentShop } = useShop();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [orderSettings, setOrderSettings] = useState<OrderSettings>({ printer_notes: [], sync_location_ids: [] });
  const [locations, setLocations] = useState<Location[]>([]);
  const [newPrinterNote, setNewPrinterNote] = useState('');

  const fetchSettings = useCallback(async () => {
    if (!currentShop) return;
    
    setLoading(true);
    try {
      const [orderSettingsRes, locationsRes] = await Promise.all([
        fetch(`/api/settings/orders?shopId=${currentShop.id}`),
        fetch(`/api/locations?shopId=${currentShop.id}`),
      ]);
      
      if (orderSettingsRes.ok) {
        const data = await orderSettingsRes.json();
        setOrderSettings(data.settings || { printer_notes: [], sync_location_ids: [] });
      }
      
      if (locationsRes.ok) {
        const data = await locationsRes.json();
        setLocations(data.locations || []);
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  }, [currentShop]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const saveOrderSettings = async (settings: OrderSettings) => {
    if (!currentShop) return;
    
    setSaving(true);
    try {
      const response = await fetch('/api/settings/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId: currentShop.id,
          printerNotes: settings.printer_notes,
          syncLocationIds: settings.sync_location_ids,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setOrderSettings(data.settings);
        notifications.show({
          title: 'Succès',
          message: 'Paramètres sauvegardés',
          color: 'green',
        });
      }
    } catch (err) {
      notifications.show({
        title: 'Erreur',
        message: 'Impossible de sauvegarder les paramètres',
        color: 'red',
      });
    } finally {
      setSaving(false);
    }
  };

  const addPrinterNote = async () => {
    if (!newPrinterNote.trim()) return;
    
    const updatedNotes = [...orderSettings.printer_notes, newPrinterNote.trim()];
    await saveOrderSettings({ ...orderSettings, printer_notes: updatedNotes });
    setNewPrinterNote('');
  };

  const removePrinterNote = async (index: number) => {
    const updatedNotes = orderSettings.printer_notes.filter((_, i) => i !== index);
    await saveOrderSettings({ ...orderSettings, printer_notes: updatedNotes });
  };

  const toggleSyncLocation = async (locationId: string) => {
    const currentIds = orderSettings.sync_location_ids || [];
    const updatedIds = currentIds.includes(locationId)
      ? currentIds.filter(id => id !== locationId)
      : [...currentIds, locationId];
    
    await saveOrderSettings({ ...orderSettings, sync_location_ids: updatedIds });
  };

  if (loading) {
    return (
      <Center h={400}>
        <Loader size="lg" />
      </Center>
    );
  }

  return (
    <div>
      <Title order={2} mb="lg">Commandes</Title>
      
      <Stack gap="lg">
        {/* Notes pour l'imprimeur */}
        <Paper withBorder p="md" radius="md">
          <Group justify="space-between" mb="md">
            <div>
              <Text fw={600}>Notes pour l'imprimeur</Text>
              <Text size="sm" c="dimmed">
                Ces rappels seront affichés en haut de la page des commandes boutique
              </Text>
            </div>
          </Group>

          <Group mb="md">
            <TextInput
              placeholder="Ajouter un rappel (ex: Retirer les étiquettes Stanley)"
              value={newPrinterNote}
              onChange={(e) => setNewPrinterNote(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addPrinterNote()}
              style={{ flex: 1 }}
            />
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={addPrinterNote}
              loading={saving}
              disabled={!newPrinterNote.trim()}
            >
              Ajouter
            </Button>
          </Group>

          {orderSettings.printer_notes.length > 0 ? (
            <Group gap="sm">
              {orderSettings.printer_notes.map((note, index) => (
                <Badge
                  key={index}
                  size="lg"
                  variant="light"
                  color="gray"
                  rightSection={
                    <ActionIcon
                      size="xs"
                      variant="transparent"
                      color="red"
                      onClick={() => removePrinterNote(index)}
                    >
                      <IconTrash size={12} />
                    </ActionIcon>
                  }
                  style={{ textTransform: 'uppercase' }}
                >
                  {note}
                </Badge>
              ))}
            </Group>
          ) : (
            <Text c="dimmed" ta="center" py="md">
              Aucun rappel configuré
            </Text>
          )}
        </Paper>

        {/* Emplacements à synchroniser */}
        <Paper withBorder p="md" radius="md">
          <Group justify="space-between" mb="md">
            <div>
              <Text fw={600}>Emplacements à synchroniser</Text>
              <Text size="sm" c="dimmed">
                Sélectionnez les emplacements dont les commandes doivent être synchronisées. Si aucun n'est sélectionné, toutes les commandes seront synchronisées.
              </Text>
            </div>
          </Group>

          {locations.length > 0 ? (
            <Stack gap="xs">
              {locations.map((location) => {
                const isSelected = orderSettings.sync_location_ids?.includes(location.id);
                return (
                  <Paper
                    key={location.id}
                    withBorder
                    p="sm"
                    radius="sm"
                    style={{
                      cursor: 'pointer',
                      backgroundColor: isSelected ? 'var(--mantine-color-blue-light)' : undefined,
                      borderColor: isSelected ? 'var(--mantine-color-blue-filled)' : undefined,
                    }}
                    onClick={() => toggleSyncLocation(location.id)}
                  >
                    <Group>
                      <IconMapPin size={18} color={isSelected ? 'var(--mantine-color-blue-filled)' : 'gray'} />
                      <Text fw={isSelected ? 600 : 400}>{location.name}</Text>
                      {isSelected && (
                        <Badge color="blue" size="sm" ml="auto">Sélectionné</Badge>
                      )}
                    </Group>
                  </Paper>
                );
              })}
            </Stack>
          ) : (
            <Text c="dimmed" ta="center" py="md">
              Aucun emplacement trouvé. Synchronisez d'abord vos emplacements Shopify.
            </Text>
          )}
        </Paper>
      </Stack>
    </div>
  );
}
