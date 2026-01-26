'use client';

import { useState, useEffect, useCallback } from 'react';
import { Title, Text, Paper, Stack, Table, TextInput, Button, Group, ActionIcon, Badge, Modal, Loader, Center } from '@mantine/core';
import { IconPlus, IconTrash, IconEdit } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useDisclosure } from '@mantine/hooks';
import { useShop } from '@/context/ShopContext';

interface MetafieldConfig {
  id?: string;
  namespace: string;
  key: string;
  display_name: string;
}

export default function MetachampsPage() {
  const { currentShop } = useShop();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [metafields, setMetafields] = useState<MetafieldConfig[]>([]);
  const [editingMetafield, setEditingMetafield] = useState<MetafieldConfig | null>(null);
  const [metafieldModalOpened, { open: openMetafieldModal, close: closeMetafieldModal }] = useDisclosure(false);

  const fetchMetafields = useCallback(async () => {
    if (!currentShop) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/settings/metafields?shopId=${currentShop.id}`);
      if (response.ok) {
        const data = await response.json();
        setMetafields(data.metafields || []);
      }
    } catch (err) {
      console.error('Error fetching metafields:', err);
    } finally {
      setLoading(false);
    }
  }, [currentShop]);

  useEffect(() => {
    fetchMetafields();
  }, [fetchMetafields]);

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
        fetchMetafields();
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save');
      }
    } catch (err: any) {
      notifications.show({
        title: 'Erreur',
        message: err.message || 'Impossible de sauvegarder le métachamp',
        color: 'red',
      });
    } finally {
      setSaving(false);
    }
  };

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
        fetchMetafields();
      }
    } catch (err) {
      notifications.show({
        title: 'Erreur',
        message: 'Impossible de supprimer le métachamp',
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
    <div>
      <Title order={2} mb="lg">Métachamps</Title>
      
      <Paper withBorder p="md" radius="md">
        <Group justify="space-between" mb="md">
          <div>
            <Text fw={600}>Métachamps à afficher</Text>
            <Text size="sm" c="dimmed">
              Configurez les métachamps Shopify à récupérer et afficher sur les commandes.
            </Text>
          </div>
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
            Aucun métachamp configuré. Ajoutez-en pour les afficher sur les commandes.
          </Text>
        )}
      </Paper>

      <Modal
        opened={metafieldModalOpened}
        onClose={closeMetafieldModal}
        title={editingMetafield?.id ? 'Modifier le métachamp' : 'Ajouter un métachamp'}
      >
        {editingMetafield && (
          <Stack>
            <TextInput
              label="Nom affiché"
              description="Le nom qui sera affiché sur les commandes (ex: Recto, Verso)"
              placeholder="ex: Recto, Verso, Taille"
              value={editingMetafield.display_name}
              onChange={(e) => setEditingMetafield({ ...editingMetafield, display_name: e.target.value })}
              required
            />
            <TextInput
              label="Namespace"
              description="Le namespace du métachamp dans Shopify"
              placeholder="ex: custom, global"
              value={editingMetafield.namespace}
              onChange={(e) => setEditingMetafield({ ...editingMetafield, namespace: e.target.value })}
              required
            />
            <TextInput
              label="Clé"
              description="La clé du métachamp dans Shopify"
              placeholder="ex: fichier_d_impression, verso_impression"
              value={editingMetafield.key}
              onChange={(e) => setEditingMetafield({ ...editingMetafield, key: e.target.value })}
              required
            />
            <Text size="xs" c="dimmed">
              Le namespace et la clé correspondent aux identifiants du métachamp dans Shopify.
            </Text>
            <Group justify="flex-end" mt="md">
              <Button variant="subtle" onClick={closeMetafieldModal}>Annuler</Button>
              <Button 
                onClick={() => saveMetafield(editingMetafield)}
                loading={saving}
                disabled={!editingMetafield.namespace || !editingMetafield.key || !editingMetafield.display_name}
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
