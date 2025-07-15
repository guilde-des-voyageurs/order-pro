import { useState, useEffect } from 'react';
import { Container, Title, Paper, Button, TextInput, NumberInput, Group, Stack, Text, ActionIcon, Modal } from '@mantine/core';
import { IconTrash, IconEdit } from '@tabler/icons-react';
import { collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/db';
import { notifications } from '@mantine/notifications';

interface PriceRule {
  id?: string;
  searchString: string;
  price: number;
  createdAt: number;
}

type SortType = 'alphabetical' | 'recent';

export function PriceRulesPage() {
  const [rules, setRules] = useState<PriceRule[]>([]);
  const [sortType, setSortType] = useState<SortType>('alphabetical');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingRule, setEditingRule] = useState<PriceRule | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [newRule, setNewRule] = useState<PriceRule>({
    searchString: '',
    price: 0,
    createdAt: 0
  });

  // Charger les règles depuis Firebase
  useEffect(() => {
    const rulesRef = collection(db, 'price-rules');
    const unsubscribe = onSnapshot(rulesRef, (snapshot) => {
      const loadedRules = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PriceRule[];
      setRules(loadedRules);
    });

    return () => unsubscribe();
  }, []);

  // Ajouter une nouvelle règle
  const handleAddRule = async () => {
    try {
      if (!newRule.searchString.trim()) {
        notifications.show({
          title: 'Erreur',
          message: 'Veuillez entrer une chaîne de recherche',
          color: 'red'
        });
        return;
      }

      if (!newRule.price) {
        notifications.show({
          title: 'Erreur',
          message: 'Veuillez entrer un prix',
          color: 'red'
        });
        return;
      }

      await addDoc(collection(db, 'price-rules'), {
        searchString: newRule.searchString.trim(),
        price: newRule.price,
        createdAt: Date.now()
      });
      
      setNewRule({
        searchString: '',
        price: 0,
        createdAt: 0
      });

      notifications.show({
        title: 'Succès',
        message: 'Règle de prix ajoutée',
        color: 'green'
      });
    } catch (error) {
      notifications.show({
        title: 'Erreur',
        message: 'Erreur lors de l\'ajout de la règle',
        color: 'red'
      });
    }
  };

  // Supprimer une règle
  const handleDeleteRule = async (ruleId: string) => {
    try {
      await deleteDoc(doc(db, 'price-rules', ruleId));
      notifications.show({
        title: 'Succès',
        message: 'Règle de prix supprimée',
        color: 'green'
      });
    } catch (error) {
      notifications.show({
        title: 'Erreur',
        message: 'Erreur lors de la suppression de la règle',
        color: 'red'
      });
    }
  };

  return (
    <Container size="lg" py="xl">
      <Group justify="space-between" align="center" mb="xl">
        <Title order={2}>Règles de prix</Title>
        <TextInput
          placeholder="Rechercher une règle..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: '300px' }}
        />
        <Button.Group>
          <Button
            variant={sortType === 'alphabetical' ? 'filled' : 'light'}
            onClick={() => setSortType('alphabetical')}
          >
            Alphabétique
          </Button>
          <Button
            variant={sortType === 'recent' ? 'filled' : 'light'}
            onClick={() => setSortType('recent')}
          >
            Plus récent
          </Button>
        </Button.Group>
      </Group>

      {/* Formulaire d'ajout */}
      <Paper withBorder p="md" mb="xl">
        <Stack>
          <Title order={4}>Nouvelle règle</Title>
          <TextInput
            label="Chaîne de recherche"
            placeholder="ex: VR1 ou CREATOR 2.0 BLACK"
            value={newRule.searchString}
            onChange={(e) => setNewRule({ ...newRule, searchString: e.target.value })}
            description="Entrez la chaîne de caractères à rechercher"
            required
          />
          <NumberInput
            label="Prix HT (€)"
            placeholder="14"
            value={newRule.price}
            onChange={(value) => setNewRule({ ...newRule, price: typeof value === 'number' ? value : 0 })}
            required
            min={0}
            decimalScale={2}
          />
          <Button onClick={handleAddRule}>Ajouter la règle</Button>
        </Stack>
      </Paper>

      {/* Liste des règles */}
      <Stack>
        {[...rules]
          .filter(rule => rule.searchString.toLowerCase().includes(searchQuery.toLowerCase()))
          .sort((a, b) => {
            if (sortType === 'alphabetical') {
              return a.searchString.localeCompare(b.searchString);
            } else {
              // Si createdAt n'existe pas, considérer la règle comme ancienne (0)
              const aTime = a.createdAt || 0;
              const bTime = b.createdAt || 0;
              return bTime - aTime;
            }
          })
          .map((rule) => (
          <Paper key={rule.id} withBorder p="md">
            <Group justify="space-between" align="flex-start">
              <div>
                <Text fw={500}>{rule.searchString}</Text>
                <Text>{rule.price.toFixed(2)}€ HT</Text>
              </div>
              <Group gap="xs">
                <ActionIcon
                  color="blue"
                  variant="subtle"
                  onClick={() => {
                    setEditingRule(rule);
                    setIsEditModalOpen(true);
                  }}
                >
                  <IconEdit size={16} />
                </ActionIcon>
                <ActionIcon 
                  color="red" 
                  variant="subtle"
                  onClick={() => rule.id && handleDeleteRule(rule.id)}
                >
                  <IconTrash size={16} />
                </ActionIcon>
              </Group>
            </Group>
          </Paper>
        ))}
      </Stack>
      {/* Modal d'édition */}
      <Modal
        opened={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingRule(null);
        }}
        title="Modifier la règle"
      >
        {editingRule && (
          <Stack>
            <TextInput
              label="Chaîne de recherche"
              value={editingRule.searchString}
              onChange={(e) => setEditingRule({ ...editingRule, searchString: e.target.value })}
              required
            />
            <NumberInput
              label="Prix HT (€)"
              value={editingRule.price}
              onChange={(value) => setEditingRule({ ...editingRule, price: typeof value === 'number' ? value : 0 })}
              required
              min={0}
              decimalScale={2}
            />
            <Button
              onClick={async () => {
                if (editingRule.id) {
                  try {
                    await updateDoc(doc(db, 'price-rules', editingRule.id), {
                      searchString: editingRule.searchString.trim(),
                      price: editingRule.price
                    });
                    notifications.show({
                      title: 'Succès',
                      message: 'Règle de prix mise à jour',
                      color: 'green'
                    });
                    setIsEditModalOpen(false);
                    setEditingRule(null);
                  } catch (error) {
                    notifications.show({
                      title: 'Erreur',
                      message: 'Erreur lors de la mise à jour de la règle',
                      color: 'red'
                    });
                  }
                }
              }}
            >
              Mettre à jour
            </Button>
          </Stack>
        )}
      </Modal>
    </Container>
  );
}
