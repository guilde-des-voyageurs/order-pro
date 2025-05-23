import { useState, useEffect } from 'react';
import { Container, Title, Paper, Button, TextInput, NumberInput, Group, Stack, Text, ActionIcon } from '@mantine/core';
import { IconTrash } from '@tabler/icons-react';
import { collection, addDoc, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/firebase/db';
import { notifications } from '@mantine/notifications';

interface PriceRule {
  id?: string;
  searchString: string;
  price: number;
}

export function PriceRulesPage() {
  const [rules, setRules] = useState<PriceRule[]>([]);
  const [newRule, setNewRule] = useState<PriceRule>({
    searchString: '',
    price: 0
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
        price: newRule.price
      });
      
      setNewRule({
        searchString: '',
        price: 0
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
      <Title order={2} mb="xl">Règles de prix</Title>

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
        {rules.map((rule) => (
          <Paper key={rule.id} withBorder p="md">
            <Group justify="space-between" align="flex-start">
              <div>
                <Text fw={500}>{rule.searchString}</Text>
                <Text>{rule.price.toFixed(2)}€ HT</Text>
              </div>
              <ActionIcon 
                color="red" 
                variant="subtle"
                onClick={() => rule.id && handleDeleteRule(rule.id)}
              >
                <IconTrash size={16} />
              </ActionIcon>
            </Group>
          </Paper>
        ))}
      </Stack>
    </Container>
  );
}
