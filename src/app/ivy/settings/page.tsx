'use client';

import { useState, useEffect, useCallback } from 'react';
import { Title, Text, Paper, Stack, Table, TextInput, Button, Group, ActionIcon, Badge, ColorSwatch, Modal, Loader, Center } from '@mantine/core';
import { IconPlus, IconTrash, IconEdit, IconPalette } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useDisclosure } from '@mantine/hooks';
import { useShop } from '@/context/ShopContext';
import styles from './settings.module.scss';

interface ColorRule {
  id?: string;
  color_name: string;
  hex_value: string;
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

  // Charger les règles depuis Supabase
  const fetchRules = useCallback(async () => {
    if (!currentShop) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/settings?shopId=${currentShop.id}`);
      if (response.ok) {
        const data = await response.json();
        setColorRules(data.colorRules || []);
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
      
      <Paper withBorder p="md" radius="md">
        <Group justify="space-between" mb="md">
          <Group>
            <IconPalette size={20} />
            <Text fw={600}>Mapping des couleurs</Text>
          </Group>
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
    </div>
  );
}
