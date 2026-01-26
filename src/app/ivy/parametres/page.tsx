'use client';

import { useState, useEffect, useCallback } from 'react';
import { Title, Text, Paper, Stack, Table, TextInput, Button, Group, ActionIcon, Badge, ColorSwatch, Modal, Loader, Center, Tabs } from '@mantine/core';
import { IconPlus, IconTrash, IconEdit, IconPalette, IconTag, IconShoppingCart, IconMapPin } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useDisclosure } from '@mantine/hooks';
import { useShop } from '@/context/ShopContext';
import styles from './settings.module.scss';

interface ColorRule {
  id?: string;
  color_name: string;
  hex_value: string;
}

interface MetafieldConfig {
  id?: string;
  namespace: string;
  key: string;
  display_name: string;
}

interface Location {
  id: string;
  name: string;
}

interface OrderSettings {
  printer_notes: string[];
  sync_location_ids: string[];
}

export default function SettingsPage() {
  const { currentShop } = useShop();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Règles de couleurs
  const [colorRules, setColorRules] = useState<ColorRule[]>([]);
  const [editingColor, setEditingColor] = useState<ColorRule | null>(null);
  const [colorModalOpened, { open: openColorModal, close: closeColorModal }] = useDisclosure(false);
  
  // Recherche
  const [colorSearch, setColorSearch] = useState('');
  
  // Métachamps
  const [metafields, setMetafields] = useState<MetafieldConfig[]>([]);
  const [editingMetafield, setEditingMetafield] = useState<MetafieldConfig | null>(null);
  const [metafieldModalOpened, { open: openMetafieldModal, close: closeMetafieldModal }] = useDisclosure(false);
  
  // Paramètres commandes
  const [orderSettings, setOrderSettings] = useState<OrderSettings>({ printer_notes: [], sync_location_ids: [] });
  const [locations, setLocations] = useState<Location[]>([]);
  const [newPrinterNote, setNewPrinterNote] = useState('');

  // Charger les règles depuis Supabase
  const fetchRules = useCallback(async () => {
    if (!currentShop) return;
    
    setLoading(true);
    try {
      const [settingsRes, metafieldsRes, orderSettingsRes, locationsRes] = await Promise.all([
        fetch(`/api/settings?shopId=${currentShop.id}`),
        fetch(`/api/settings/metafields?shopId=${currentShop.id}`),
        fetch(`/api/settings/orders?shopId=${currentShop.id}`),
        fetch(`/api/locations?shopId=${currentShop.id}`),
      ]);
      
      if (settingsRes.ok) {
        const data = await settingsRes.json();
        setColorRules(data.colorRules || []);
      }
      
      if (metafieldsRes.ok) {
        const data = await metafieldsRes.json();
        setMetafields(data.metafields || []);
      }
      
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
    fetchRules();
  }, [fetchRules]);

  // Sauvegarder une règle de couleur
  const saveColorRule = async (rule: ColorRule) => {
    if (!currentShop) return;
    
    setSaving(true);
    try {
      const response = await fetch('/api/settings/colors', {
        method: rule.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...rule,
          shopId: currentShop.id,
        }),
      });

      if (response.ok) {
        notifications.show({
          title: 'Succès',
          message: 'Règle de couleur sauvegardée',
          color: 'green',
        });
        closeColorModal();
        fetchRules();
      } else {
        throw new Error('Failed to save');
      }
    } catch (err) {
      notifications.show({
        title: 'Erreur',
        message: 'Impossible de sauvegarder la règle',
        color: 'red',
      });
    } finally {
      setSaving(false);
    }
  };

  // Supprimer une règle de couleur
  const deleteColorRule = async (id: string) => {
    if (!currentShop) return;
    
    try {
      const response = await fetch(`/api/settings/colors?id=${id}&shopId=${currentShop.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        notifications.show({
          title: 'Succès',
          message: 'Règle supprimée',
          color: 'green',
        });
        fetchRules();
      }
    } catch (err) {
      notifications.show({
        title: 'Erreur',
        message: 'Impossible de supprimer la règle',
        color: 'red',
      });
    }
  };

  // Sauvegarder un métachamp
  const saveMetafield = async (metafield: MetafieldConfig) => {
    if (!currentShop) return;
    
    setSaving(true);
    try {
      const response = await fetch('/api/settings/metafields', {
        method: metafield.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: metafield.id,
          shopId: currentShop.id,
          namespace: metafield.namespace,
          key: metafield.key,
          displayName: metafield.display_name,
        }),
      });

      if (response.ok) {
        notifications.show({
          title: 'Succès',
          message: 'Métachamp sauvegardé',
          color: 'green',
        });
        closeMetafieldModal();
        fetchRules();
      } else {
        throw new Error('Failed to save');
      }
    } catch (err) {
      notifications.show({
        title: 'Erreur',
        message: 'Impossible de sauvegarder le métachamp',
        color: 'red',
      });
    } finally {
      setSaving(false);
    }
  };

  // Supprimer un métachamp
  const deleteMetafield = async (id: string) => {
    if (!currentShop) return;
    
    try {
      const response = await fetch(`/api/settings/metafields?id=${id}&shopId=${currentShop.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        notifications.show({
          title: 'Succès',
          message: 'Métachamp supprimé',
          color: 'green',
        });
        fetchRules();
      }
    } catch (err) {
      notifications.show({
        title: 'Erreur',
        message: 'Impossible de supprimer le métachamp',
        color: 'red',
      });
    }
  };

  // Ajouter une note imprimeur
  const addPrinterNote = async () => {
    if (!currentShop || !newPrinterNote.trim()) return;
    
    const updatedNotes = [...orderSettings.printer_notes, newPrinterNote.trim()];
    await saveOrderSettings({ ...orderSettings, printer_notes: updatedNotes });
    setNewPrinterNote('');
  };

  // Supprimer une note imprimeur
  const removePrinterNote = async (index: number) => {
    if (!currentShop) return;
    
    const updatedNotes = orderSettings.printer_notes.filter((_, i) => i !== index);
    await saveOrderSettings({ ...orderSettings, printer_notes: updatedNotes });
  };

  // Toggle emplacement de synchronisation
  const toggleSyncLocation = async (locationId: string) => {
    if (!currentShop) return;
    
    const currentIds = orderSettings.sync_location_ids || [];
    const updatedIds = currentIds.includes(locationId)
      ? currentIds.filter(id => id !== locationId)
      : [...currentIds, locationId];
    
    await saveOrderSettings({ ...orderSettings, sync_location_ids: updatedIds });
  };

  // Sauvegarder les paramètres de commandes
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

  if (loading) {
    return (
      <Center h={400}>
        <Loader size="lg" />
      </Center>
    );
  }

  return (
    <div className={styles.container}>
      <Title order={2} mb="lg">Options Globales</Title>
      
      <Tabs defaultValue="orders">
        <Tabs.List mb="lg">
          <Tabs.Tab value="orders" leftSection={<IconShoppingCart size={16} />}>
            Commandes
          </Tabs.Tab>
          <Tabs.Tab value="colors" leftSection={<IconPalette size={16} />}>
            Couleurs ({colorRules.length})
          </Tabs.Tab>
          <Tabs.Tab value="metafields" leftSection={<IconTag size={16} />}>
            Métachamps ({metafields.length})
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="orders">
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
        </Tabs.Panel>

        <Tabs.Panel value="colors">
          <Paper withBorder p="md" radius="md">
            <Group justify="space-between" mb="md">
              <Text fw={600}>Mapping des couleurs</Text>
              <Button
                leftSection={<IconPlus size={16} />}
                onClick={() => {
                  setEditingColor({ color_name: '', hex_value: '#000000' });
                  openColorModal();
                }}
              >
                Ajouter une couleur
              </Button>
            </Group>

            {colorRules.length > 0 && (
              <TextInput
                placeholder="Rechercher une couleur..."
                value={colorSearch}
                onChange={(e) => setColorSearch(e.target.value)}
                mb="md"
              />
            )}

            {colorRules.length > 0 ? (
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Couleur</Table.Th>
                    <Table.Th>Nom</Table.Th>
                    <Table.Th>Code Hex</Table.Th>
                    <Table.Th style={{ width: 100 }}>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {colorRules
                    .filter(rule => 
                      colorSearch === '' || 
                      rule.color_name.toLowerCase().includes(colorSearch.toLowerCase()) ||
                      rule.hex_value.toLowerCase().includes(colorSearch.toLowerCase())
                    )
                    .map((rule) => (
                    <Table.Tr key={rule.id || rule.color_name}>
                      <Table.Td>
                        <ColorSwatch color={rule.hex_value} size={24} />
                      </Table.Td>
                      <Table.Td>{rule.color_name}</Table.Td>
                      <Table.Td>
                        <Badge variant="light" color="gray">{rule.hex_value}</Badge>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <ActionIcon
                            variant="subtle"
                            color="blue"
                            onClick={() => {
                              setEditingColor(rule);
                              openColorModal();
                            }}
                          >
                            <IconEdit size={16} />
                          </ActionIcon>
                          <ActionIcon
                            variant="subtle"
                            color="red"
                            onClick={() => rule.id && deleteColorRule(rule.id)}
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            ) : (
              <Text c="dimmed" ta="center" py="xl">
                Aucune règle de couleur définie.
              </Text>
            )}
          </Paper>
        </Tabs.Panel>

        <Tabs.Panel value="metafields">
          <Paper withBorder p="md" radius="md">
            <Group justify="space-between" mb="md">
              <Text fw={600}>Métachamps à récupérer pour les commandes batch</Text>
              <Button
                leftSection={<IconPlus size={16} />}
                onClick={() => {
                  setEditingMetafield({ namespace: '', key: '', display_name: '' });
                  openMetafieldModal();
                }}
              >
                Ajouter un métachamp
              </Button>
            </Group>

            <Text size="sm" c="dimmed" mb="md">
              Ces métachamps seront récupérés depuis Shopify lors de l'ajout d'articles aux commandes fournisseur.
            </Text>

            {metafields.length > 0 ? (
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Nom affiché</Table.Th>
                    <Table.Th>Namespace</Table.Th>
                    <Table.Th>Clé</Table.Th>
                    <Table.Th style={{ width: 100 }}>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {metafields.map((mf) => (
                    <Table.Tr key={mf.id}>
                      <Table.Td fw={500}>{mf.display_name}</Table.Td>
                      <Table.Td>
                        <Badge variant="light" color="blue">{mf.namespace}</Badge>
                      </Table.Td>
                      <Table.Td>
                        <Badge variant="light" color="gray">{mf.key}</Badge>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <ActionIcon
                            variant="subtle"
                            color="blue"
                            onClick={() => {
                              setEditingMetafield(mf);
                              openMetafieldModal();
                            }}
                          >
                            <IconEdit size={16} />
                          </ActionIcon>
                          <ActionIcon
                            variant="subtle"
                            color="red"
                            onClick={() => mf.id && deleteMetafield(mf.id)}
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            ) : (
              <Text c="dimmed" ta="center" py="xl">
                Aucun métachamp configuré. Ajoutez-en pour les récupérer lors des commandes batch.
              </Text>
            )}
          </Paper>
        </Tabs.Panel>
      </Tabs>

      {/* Modal édition couleur */}
      <Modal
        opened={colorModalOpened}
        onClose={closeColorModal}
        title={editingColor?.id ? 'Modifier la couleur' : 'Ajouter une couleur'}
      >
        {editingColor && (
          <Stack>
            <TextInput
              label="Nom de la couleur"
              placeholder="ex: Rouge, Bleu Marine"
              value={editingColor.color_name}
              onChange={(e) => setEditingColor({ ...editingColor, color_name: e.target.value })}
            />
            <Group align="flex-end">
              <TextInput
                label="Code hexadécimal"
                placeholder="#FF0000"
                value={editingColor.hex_value}
                onChange={(e) => setEditingColor({ ...editingColor, hex_value: e.target.value })}
                style={{ flex: 1 }}
              />
              <div style={{ paddingTop: 24 }}>
                <ColorSwatch color={editingColor.hex_value} size={36} />
              </div>
            </Group>
            <Group justify="flex-end" mt="md">
              <Button variant="subtle" onClick={closeColorModal}>Annuler</Button>
              <Button 
                onClick={() => saveColorRule(editingColor)}
                loading={saving}
              >
                Sauvegarder
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>

      {/* Modal édition métachamp */}
      <Modal
        opened={metafieldModalOpened}
        onClose={closeMetafieldModal}
        title={editingMetafield?.id ? 'Modifier le métachamp' : 'Ajouter un métachamp'}
      >
        {editingMetafield && (
          <Stack>
            <TextInput
              label="Nom affiché"
              placeholder="ex: Couleur saisonnière"
              value={editingMetafield.display_name}
              onChange={(e) => setEditingMetafield({ ...editingMetafield, display_name: e.target.value })}
            />
            <TextInput
              label="Namespace"
              placeholder="ex: custom, global"
              value={editingMetafield.namespace}
              onChange={(e) => setEditingMetafield({ ...editingMetafield, namespace: e.target.value })}
            />
            <TextInput
              label="Clé"
              placeholder="ex: seasonal_color"
              value={editingMetafield.key}
              onChange={(e) => setEditingMetafield({ ...editingMetafield, key: e.target.value })}
            />
            <Text size="xs" c="dimmed">
              Le namespace et la clé correspondent aux identifiants du métachamp dans Shopify.
            </Text>
            <Group justify="flex-end" mt="md">
              <Button variant="subtle" onClick={closeMetafieldModal}>Annuler</Button>
              <Button 
                onClick={() => saveMetafield(editingMetafield)}
                loading={saving}
                disabled={!editingMetafield.namespace || !editingMetafield.key}
              >
                Sauvegarder
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </div>
  );
}
