'use client';

import { useState, useEffect, useCallback } from 'react';
import { Title, Text, Paper, Stack, Tabs, Table, TextInput, NumberInput, Button, Group, ActionIcon, Badge, ColorSwatch, Modal, Select, Switch, Loader, Center } from '@mantine/core';
import { IconPlus, IconTrash, IconEdit, IconCheck, IconX, IconPalette, IconCurrencyEuro, IconTag } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useDisclosure } from '@mantine/hooks';
import { useShop } from '@/context/ShopContext';
import styles from './settings.module.scss';

interface ColorRule {
  id?: string;
  color_name: string;
  hex_value: string;
}

interface PricingRule {
  id?: string;
  rule_name: string;
  rule_type: 'base_price' | 'color_markup' | 'size_markup' | 'sku_markup' | 'custom';
  condition_field?: string;
  condition_value?: string;
  price_value: number;
  is_percentage: boolean;
  priority: number;
  is_active: boolean;
}

interface MetafieldRule {
  id?: string;
  metafield_key: string;
  display_name?: string;
  is_active: boolean;
  display_order: number;
}

export default function SettingsPage() {
  const { currentShop } = useShop();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Règles de couleurs
  const [colorRules, setColorRules] = useState<ColorRule[]>([]);
  const [editingColor, setEditingColor] = useState<ColorRule | null>(null);
  const [colorModalOpened, { open: openColorModal, close: closeColorModal }] = useDisclosure(false);
  
  // Règles de prix
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [editingPricing, setEditingPricing] = useState<PricingRule | null>(null);
  const [pricingModalOpened, { open: openPricingModal, close: closePricingModal }] = useDisclosure(false);
  
  // Règles de métachamps
  const [metafieldRules, setMetafieldRules] = useState<MetafieldRule[]>([]);
  const [editingMetafield, setEditingMetafield] = useState<MetafieldRule | null>(null);
  const [metafieldModalOpened, { open: openMetafieldModal, close: closeMetafieldModal }] = useDisclosure(false);
  
  // Recherche
  const [colorSearch, setColorSearch] = useState('');
  const [pricingSearch, setPricingSearch] = useState('');
  const [metafieldSearch, setMetafieldSearch] = useState('');

  // Charger les règles depuis Supabase
  const fetchRules = useCallback(async () => {
    if (!currentShop) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/settings?shopId=${currentShop.id}`);
      if (response.ok) {
        const data = await response.json();
        setColorRules(data.colorRules || []);
        setPricingRules(data.pricingRules || []);
        setMetafieldRules(data.metafieldRules || []);
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
        body: JSON.stringify({ shopId: currentShop.id, ...rule }),
      });
      
      if (response.ok) {
        notifications.show({
          title: 'Succès',
          message: 'Couleur sauvegardée',
          color: 'green',
        });
        closeColorModal();
        fetchRules();
      }
    } catch (err) {
      console.error('Error saving color:', err);
      notifications.show({
        title: 'Erreur',
        message: 'Impossible de sauvegarder la couleur',
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
          message: 'Couleur supprimée',
          color: 'green',
        });
        fetchRules();
      }
    } catch (err) {
      console.error('Error deleting color:', err);
    }
  };

  // Sauvegarder une règle de prix
  const savePricingRule = async (rule: PricingRule) => {
    if (!currentShop) return;
    
    setSaving(true);
    try {
      const response = await fetch('/api/settings/pricing', {
        method: rule.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopId: currentShop.id, ...rule }),
      });
      
      if (response.ok) {
        notifications.show({
          title: 'Succès',
          message: 'Règle de prix sauvegardée',
          color: 'green',
        });
        closePricingModal();
        fetchRules();
      }
    } catch (err) {
      console.error('Error saving pricing rule:', err);
      notifications.show({
        title: 'Erreur',
        message: 'Impossible de sauvegarder la règle',
        color: 'red',
      });
    } finally {
      setSaving(false);
    }
  };

  // Supprimer une règle de prix
  const deletePricingRule = async (id: string) => {
    if (!currentShop) return;
    
    try {
      const response = await fetch(`/api/settings/pricing?id=${id}&shopId=${currentShop.id}`, {
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
      console.error('Error deleting pricing rule:', err);
    }
  };

  // Sauvegarder une règle de métachamp
  const saveMetafieldRule = async (rule: MetafieldRule) => {
    if (!currentShop) return;
    
    setSaving(true);
    try {
      const response = await fetch('/api/settings/metafields', {
        method: rule.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopId: currentShop.id, ...rule }),
      });
      
      if (response.ok) {
        notifications.show({
          title: 'Succès',
          message: 'Métachamp sauvegardé',
          color: 'green',
        });
        closeMetafieldModal();
        fetchRules();
      }
    } catch (err) {
      console.error('Error saving metafield rule:', err);
      notifications.show({
        title: 'Erreur',
        message: 'Impossible de sauvegarder le métachamp',
        color: 'red',
      });
    } finally {
      setSaving(false);
    }
  };

  // Supprimer une règle de métachamp
  const deleteMetafieldRule = async (id: string) => {
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
      console.error('Error deleting metafield rule:', err);
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
      
      <Tabs defaultValue="colors">
        <Tabs.List mb="lg">
          <Tabs.Tab value="colors" leftSection={<IconPalette size={16} />}>
            Règles de couleurs
          </Tabs.Tab>
          <Tabs.Tab value="pricing" leftSection={<IconCurrencyEuro size={16} />}>
            Règles de prix
          </Tabs.Tab>
          <Tabs.Tab value="metafields" leftSection={<IconTag size={16} />}>
            Métachamps produits
          </Tabs.Tab>
        </Tabs.List>

        {/* Onglet Couleurs */}
        <Tabs.Panel value="colors">
          <Paper withBorder p="md" radius="md">
            <Group justify="space-between" mb="md">
              <Text fw={600}>Mapping des couleurs</Text>
              <Group> 
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
                Aucune règle de couleur définie. Cliquez sur "Initialiser" pour charger les couleurs par défaut.
              </Text>
            )}
          </Paper>
        </Tabs.Panel>

        {/* Onglet Prix */}
        <Tabs.Panel value="pricing">
          <Paper withBorder p="md" radius="md">
            <Group justify="space-between" mb="md">
              <Text fw={600}>Règles de tarification</Text>
              <Button
                leftSection={<IconPlus size={16} />}
                onClick={() => {
                  setEditingPricing({
                    rule_name: '',
                    rule_type: 'base_price',
                    price_value: 0,
                    is_percentage: false,
                    priority: 0,
                    is_active: true,
                  });
                  openPricingModal();
                }}
              >
                Ajouter une règle
              </Button>
            </Group>

            {pricingRules.length > 0 && (
              <TextInput
                placeholder="Rechercher une règle..."
                value={pricingSearch}
                onChange={(e) => setPricingSearch(e.target.value)}
                mb="md"
              />
            )}

            {pricingRules.length > 0 ? (
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Nom</Table.Th>
                    <Table.Th>Type</Table.Th>
                    <Table.Th>Condition</Table.Th>
                    <Table.Th>Valeur</Table.Th>
                    <Table.Th>Priorité</Table.Th>
                    <Table.Th>Actif</Table.Th>
                    <Table.Th style={{ width: 100 }}>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {pricingRules
                    .filter(rule => 
                      pricingSearch === '' || 
                      rule.rule_name.toLowerCase().includes(pricingSearch.toLowerCase()) ||
                      (rule.condition_value && rule.condition_value.toLowerCase().includes(pricingSearch.toLowerCase()))
                    )
                    .map((rule) => (
                    <Table.Tr key={rule.id}>
                      <Table.Td>{rule.rule_name}</Table.Td>
                      <Table.Td>
                        <Badge variant="light">
                          {rule.rule_type === 'base_price' && 'Prix de base'}
                          {rule.rule_type === 'color_markup' && 'Majoration couleur'}
                          {rule.rule_type === 'size_markup' && 'Majoration taille'}
                          {rule.rule_type === 'sku_markup' && 'Majoration SKU'}
                          {rule.rule_type === 'custom' && 'Personnalisé'}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        {rule.condition_field && rule.condition_value 
                          ? `${rule.condition_field} = ${rule.condition_value}`
                          : '-'
                        }
                      </Table.Td>
                      <Table.Td>
                        {rule.is_percentage 
                          ? `${rule.price_value}%`
                          : `${rule.price_value.toFixed(2)} €`
                        }
                      </Table.Td>
                      <Table.Td>{rule.priority}</Table.Td>
                      <Table.Td>
                        {rule.is_active 
                          ? <IconCheck size={16} color="green" />
                          : <IconX size={16} color="red" />
                        }
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <ActionIcon
                            variant="subtle"
                            color="blue"
                            onClick={() => {
                              setEditingPricing(rule);
                              openPricingModal();
                            }}
                          >
                            <IconEdit size={16} />
                          </ActionIcon>
                          <ActionIcon
                            variant="subtle"
                            color="red"
                            onClick={() => rule.id && deletePricingRule(rule.id)}
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
                Aucune règle de prix définie. Ajoutez des règles pour calculer automatiquement les coûts.
              </Text>
            )}
          </Paper>
        </Tabs.Panel>

        {/* Onglet Métachamps */}
        <Tabs.Panel value="metafields">
          <Paper withBorder p="md" radius="md">
            <Group justify="space-between" mb="md">
              <div>
                <Text fw={600}>Métachamps à afficher</Text>
                <Text size="sm" c="dimmed">
                  Configurez les métachamps Shopify à afficher dans les commandes batch
                </Text>
              </div>
              <Button
                leftSection={<IconPlus size={16} />}
                onClick={() => {
                  setEditingMetafield({
                    metafield_key: '',
                    display_name: '',
                    is_active: true,
                    display_order: metafieldRules.length,
                  });
                  openMetafieldModal();
                }}
              >
                Ajouter un métachamp
              </Button>
            </Group>

            {metafieldRules.length > 0 && (
              <TextInput
                placeholder="Rechercher un métachamp..."
                value={metafieldSearch}
                onChange={(e) => setMetafieldSearch(e.target.value)}
                mb="md"
              />
            )}

            {metafieldRules.length > 0 ? (
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Clé du métachamp</Table.Th>
                    <Table.Th>Nom affiché</Table.Th>
                    <Table.Th>Ordre</Table.Th>
                    <Table.Th>Actif</Table.Th>
                    <Table.Th style={{ width: 100 }}>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {metafieldRules
                    .filter(rule => 
                      metafieldSearch === '' || 
                      rule.metafield_key.toLowerCase().includes(metafieldSearch.toLowerCase()) ||
                      (rule.display_name && rule.display_name.toLowerCase().includes(metafieldSearch.toLowerCase()))
                    )
                    .sort((a, b) => a.display_order - b.display_order)
                    .map((rule) => (
                    <Table.Tr key={rule.id || rule.metafield_key}>
                      <Table.Td>
                        <Badge variant="light" color="grape">{rule.metafield_key}</Badge>
                      </Table.Td>
                      <Table.Td>{rule.display_name || rule.metafield_key}</Table.Td>
                      <Table.Td>{rule.display_order}</Table.Td>
                      <Table.Td>
                        {rule.is_active 
                          ? <IconCheck size={16} color="green" />
                          : <IconX size={16} color="red" />
                        }
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <ActionIcon
                            variant="subtle"
                            color="blue"
                            onClick={() => {
                              setEditingMetafield(rule);
                              openMetafieldModal();
                            }}
                          >
                            <IconEdit size={16} />
                          </ActionIcon>
                          <ActionIcon
                            variant="subtle"
                            color="red"
                            onClick={() => rule.id && deleteMetafieldRule(rule.id)}
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
                Aucun métachamp configuré. Ajoutez des métachamps pour les afficher dans les commandes batch.
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
              placeholder="ex: rouge, bleu marine..."
              value={editingColor.color_name}
              onChange={(e) => setEditingColor({ ...editingColor, color_name: e.target.value })}
            />
            <Group>
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

      {/* Modal édition règle de prix */}
      <Modal
        opened={pricingModalOpened}
        onClose={closePricingModal}
        title={editingPricing?.id ? 'Modifier la règle' : 'Ajouter une règle'}
        size="lg"
      >
        {editingPricing && (
          <Stack>
            <TextInput
              label="Nom de la règle"
              placeholder="ex: Prix de base T-shirt"
              value={editingPricing.rule_name}
              onChange={(e) => setEditingPricing({ ...editingPricing, rule_name: e.target.value })}
            />
            <Select
              label="Type de règle"
              value={editingPricing.rule_type}
              onChange={(value) => setEditingPricing({ 
                ...editingPricing, 
                rule_type: value as PricingRule['rule_type'] 
              })}
              data={[
                { value: 'base_price', label: 'Prix de base' },
                { value: 'color_markup', label: 'Majoration couleur' },
                { value: 'size_markup', label: 'Majoration taille' },
                { value: 'sku_markup', label: 'Majoration SKU' },
                { value: 'custom', label: 'Personnalisé' },
              ]}
            />
            {editingPricing.rule_type !== 'base_price' && (
              <Group grow>
                <TextInput
                  label="Champ de condition"
                  placeholder="ex: color, size, sku_prefix"
                  value={editingPricing.condition_field || ''}
                  onChange={(e) => setEditingPricing({ ...editingPricing, condition_field: e.target.value })}
                />
                <TextInput
                  label="Valeur de condition"
                  placeholder="ex: Rouge, XL, CRAFTER"
                  value={editingPricing.condition_value || ''}
                  onChange={(e) => setEditingPricing({ ...editingPricing, condition_value: e.target.value })}
                />
              </Group>
            )}
            <Group grow>
              <NumberInput
                label="Valeur"
                value={editingPricing.price_value}
                onChange={(value) => setEditingPricing({ ...editingPricing, price_value: Number(value) || 0 })}
                decimalScale={2}
                min={0}
              />
              <NumberInput
                label="Priorité"
                value={editingPricing.priority}
                onChange={(value) => setEditingPricing({ ...editingPricing, priority: Number(value) || 0 })}
                min={0}
              />
            </Group>
            <Group>
              <Switch
                label="Valeur en pourcentage"
                checked={editingPricing.is_percentage}
                onChange={(e) => setEditingPricing({ ...editingPricing, is_percentage: e.currentTarget.checked })}
              />
              <Switch
                label="Règle active"
                checked={editingPricing.is_active}
                onChange={(e) => setEditingPricing({ ...editingPricing, is_active: e.currentTarget.checked })}
              />
            </Group>
            <Group justify="flex-end" mt="md">
              <Button variant="subtle" onClick={closePricingModal}>Annuler</Button>
              <Button 
                onClick={() => savePricingRule(editingPricing)}
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
              label="Clé du métachamp"
              placeholder="ex: verso_impression, couleur_saisonniere"
              description="La clé exacte du métachamp Shopify (sans le namespace)"
              value={editingMetafield.metafield_key}
              onChange={(e) => setEditingMetafield({ ...editingMetafield, metafield_key: e.target.value })}
            />
            <TextInput
              label="Nom affiché (optionnel)"
              placeholder="ex: Impression Verso"
              description="Le nom à afficher dans l'interface. Si vide, la clé sera utilisée."
              value={editingMetafield.display_name || ''}
              onChange={(e) => setEditingMetafield({ ...editingMetafield, display_name: e.target.value })}
            />
            <NumberInput
              label="Ordre d'affichage"
              value={editingMetafield.display_order}
              onChange={(value) => setEditingMetafield({ ...editingMetafield, display_order: Number(value) || 0 })}
              min={0}
            />
            <Switch
              label="Métachamp actif"
              checked={editingMetafield.is_active}
              onChange={(e) => setEditingMetafield({ ...editingMetafield, is_active: e.currentTarget.checked })}
            />
            <Group justify="flex-end" mt="md">
              <Button variant="subtle" onClick={closeMetafieldModal}>Annuler</Button>
              <Button 
                onClick={() => saveMetafieldRule(editingMetafield)}
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
