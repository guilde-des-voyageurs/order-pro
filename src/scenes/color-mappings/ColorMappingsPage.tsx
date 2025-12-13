'use client';

import { useState, useEffect } from 'react';
import { Title, Text, Button, Table, TextInput, Group, Stack, Paper, ActionIcon, Modal, Loader } from '@mantine/core';
import { IconPlus, IconEdit, IconTrash, IconCheck, IconX } from '@tabler/icons-react';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, writeBatch } from 'firebase/firestore';
import { db } from '@/firebase/db';
import { notifications } from '@mantine/notifications';
import { colorMappings } from '@/utils/color-transformer';

interface ColorMapping {
  id: string;
  frenchName: string;
  englishName: string;
  createdAt: string;
  updatedAt: string;
}

export function ColorMappingsPage() {
  const [mappings, setMappings] = useState<ColorMapping[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMapping, setEditingMapping] = useState<ColorMapping | null>(null);
  const [frenchName, setFrenchName] = useState('');
  const [englishName, setEnglishName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);

  // Écouter les changements en temps réel
  useEffect(() => {
    const q = query(collection(db, 'color-mappings'), orderBy('frenchName', 'asc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ColorMapping[];
      
      setMappings(data);
      setIsLoading(false);
    }, (error) => {
      console.error('Erreur lors du chargement:', error);
      notifications.show({
        title: 'Erreur',
        message: 'Impossible de charger les règles de couleur',
        color: 'red'
      });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleOpenModal = (mapping?: ColorMapping) => {
    if (mapping) {
      setEditingMapping(mapping);
      setFrenchName(mapping.frenchName);
      setEnglishName(mapping.englishName);
    } else {
      setEditingMapping(null);
      setFrenchName('');
      setEnglishName('');
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingMapping(null);
    setFrenchName('');
    setEnglishName('');
  };

  const handleSave = async () => {
    if (!frenchName.trim() || !englishName.trim()) {
      notifications.show({
        title: 'Erreur',
        message: 'Veuillez remplir tous les champs',
        color: 'red'
      });
      return;
    }

    setIsSaving(true);
    try {
      if (editingMapping) {
        // Mise à jour
        await updateDoc(doc(db, 'color-mappings', editingMapping.id), {
          frenchName: frenchName.trim(),
          englishName: englishName.trim(),
          updatedAt: new Date().toISOString()
        });
        
        notifications.show({
          title: 'Succès',
          message: 'Règle mise à jour',
          color: 'green'
        });
      } else {
        // Création
        await addDoc(collection(db, 'color-mappings'), {
          frenchName: frenchName.trim(),
          englishName: englishName.trim(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        
        notifications.show({
          title: 'Succès',
          message: 'Règle créée',
          color: 'green'
        });
      }
      
      handleCloseModal();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      notifications.show({
        title: 'Erreur',
        message: 'Impossible de sauvegarder la règle',
        color: 'red'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (mapping: ColorMapping) => {
    if (!confirm(`Supprimer la règle "${mapping.frenchName}" → "${mapping.englishName}" ?`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'color-mappings', mapping.id));
      
      notifications.show({
        title: 'Succès',
        message: 'Règle supprimée',
        color: 'green'
      });
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      notifications.show({
        title: 'Erreur',
        message: 'Impossible de supprimer la règle',
        color: 'red'
      });
    }
  };

  const handleMigrate = async () => {
    if (!confirm('Importer les règles depuis color-transformer.ts ? Cela ajoutera toutes les règles manquantes.')) {
      return;
    }

    setIsMigrating(true);
    try {
      const batch = writeBatch(db);
      let count = 0;

      // Pour chaque règle dans colorMappings
      Object.entries(colorMappings).forEach(([frenchName, mapping]) => {
        // Vérifier si elle existe déjà
        const exists = mappings.some(m => 
          m.frenchName.toLowerCase() === frenchName.toLowerCase()
        );

        if (!exists) {
          const docRef = doc(collection(db, 'color-mappings'));
          batch.set(docRef, {
            frenchName,
            englishName: mapping.internalName,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
          count++;
        }
      });

      await batch.commit();

      notifications.show({
        title: 'Migration réussie',
        message: `${count} règle${count > 1 ? 's' : ''} importée${count > 1 ? 's' : ''}`,
        color: 'green'
      });
    } catch (error) {
      console.error('Erreur lors de la migration:', error);
      notifications.show({
        title: 'Erreur',
        message: 'Impossible de migrer les règles',
        color: 'red'
      });
    } finally {
      setIsMigrating(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Loader />
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem' }}>
      <Stack gap="xl">
        <Group justify="space-between" align="center">
          <div>
            <Title order={1}>Règles de transformation de couleur</Title>
            <Text size="sm" c="dimmed">Gestion des correspondances Français → Anglais</Text>
          </div>
          <Group>
            {mappings.length === 0 && (
              <Button
                variant="light"
                color="blue"
                onClick={handleMigrate}
                loading={isMigrating}
              >
                Importer les règles existantes
              </Button>
            )}
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={() => handleOpenModal()}
            >
              Ajouter une règle
            </Button>
          </Group>
        </Group>

        <Paper withBorder>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Nom français</Table.Th>
                <Table.Th>Nom anglais</Table.Th>
                <Table.Th style={{ width: 100 }}>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {mappings.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={3} style={{ textAlign: 'center', padding: '2rem' }}>
                    <Text c="dimmed">Aucune règle définie</Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                mappings.map((mapping) => (
                  <Table.Tr key={mapping.id}>
                    <Table.Td>
                      <Text fw={500}>{mapping.frenchName}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text c="dimmed">{mapping.englishName}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <ActionIcon
                          variant="light"
                          color="blue"
                          onClick={() => handleOpenModal(mapping)}
                        >
                          <IconEdit size={16} />
                        </ActionIcon>
                        <ActionIcon
                          variant="light"
                          color="red"
                          onClick={() => handleDelete(mapping)}
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
        </Paper>

        <Text size="sm" c="dimmed">
          {mappings.length} règle{mappings.length > 1 ? 's' : ''} définie{mappings.length > 1 ? 's' : ''}
        </Text>
      </Stack>

      <Modal
        opened={isModalOpen}
        onClose={handleCloseModal}
        title={editingMapping ? 'Modifier la règle' : 'Ajouter une règle'}
      >
        <Stack gap="md">
          <TextInput
            label="Nom français"
            placeholder="Ex: Bleu Marine"
            value={frenchName}
            onChange={(e) => setFrenchName(e.currentTarget.value)}
            required
          />
          <TextInput
            label="Nom anglais"
            placeholder="Ex: French Navy"
            value={englishName}
            onChange={(e) => setEnglishName(e.currentTarget.value)}
            required
          />
          <Group justify="flex-end" gap="xs">
            <Button
              variant="light"
              color="gray"
              leftSection={<IconX size={16} />}
              onClick={handleCloseModal}
            >
              Annuler
            </Button>
            <Button
              leftSection={<IconCheck size={16} />}
              onClick={handleSave}
              loading={isSaving}
            >
              {editingMapping ? 'Mettre à jour' : 'Créer'}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </div>
  );
}
