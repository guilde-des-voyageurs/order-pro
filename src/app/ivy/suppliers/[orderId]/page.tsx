'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Title, Text, Paper, Table, Button, Group, Badge, ActionIcon, Modal, NumberInput, Checkbox, Loader, Center, Stack, Textarea, Divider, Progress, TextInput, SimpleGrid } from '@mantine/core';
import { IconArrowLeft, IconPlus, IconTrash, IconDeviceFloppy, IconCheck, IconLock, IconSearch, IconPackage } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useDisclosure } from '@mantine/hooks';
import { useShop } from '@/context/ShopContext';
import { useLocation } from '@/context/LocationContext';
import { ProductCard, ProductData } from '@/components/Inventory';
import styles from './order-detail.module.scss';

interface OrderItem {
  id: string;
  variant_id: string | null;
  product_title: string;
  variant_title: string | null;
  sku: string | null;
  quantity: number;
  unit_price: number;
  line_total: number;
  is_validated: boolean;
  validated_at: string | null;
}

interface SupplierOrder {
  id: string;
  order_number: string;
  status: 'draft' | 'in_progress' | 'completed';
  note: string | null;
  subtotal: number;
  balance_adjustment: number;
  total_ht: number;
  total_ttc: number;
  created_at: string;
  closed_at: string | null;
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;
  const { currentShop } = useShop();
  const { currentLocation } = useLocation();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [order, setOrder] = useState<SupplierOrder | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [note, setNote] = useState('');
  const [balanceAdjustment, setBalanceAdjustment] = useState(0);
  
  // Modal ajout produits
  const [addModalOpened, { open: openAddModal, close: closeAddModal }] = useDisclosure(false);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVariants, setSelectedVariants] = useState<Record<string, number>>({});

  // Charger la commande et ses articles
  const fetchOrder = useCallback(async () => {
    if (!currentShop || !orderId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/suppliers/orders/${orderId}?shopId=${currentShop.id}`);
      if (response.ok) {
        const data = await response.json();
        setOrder(data.order);
        setItems(data.items || []);
        setNote(data.order.note || '');
        setBalanceAdjustment(data.order.balance_adjustment || 0);
      } else {
        throw new Error('Order not found');
      }
    } catch (err) {
      console.error('Error fetching order:', err);
      notifications.show({
        title: 'Erreur',
        message: 'Impossible de charger la commande',
        color: 'red',
      });
      router.push('/ivy/suppliers');
    } finally {
      setLoading(false);
    }
  }, [currentShop, orderId, router]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  // Charger les produits pour l'ajout
  const fetchProducts = async () => {
    if (!currentShop) return;
    
    setLoadingProducts(true);
    try {
      const params = new URLSearchParams({ shopId: currentShop.id });
      if (currentLocation) {
        params.append('locationId', currentLocation.id);
      }
      const response = await fetch(`/api/products?${params}`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Ouvrir le modal d'ajout
  const handleOpenAddModal = () => {
    fetchProducts();
    setSelectedVariants({});
    setSearchQuery('');
    openAddModal();
  };

  // Filtrer les produits
  const filteredProducts = useMemo(() => {
    if (!searchQuery) return products;
    const query = searchQuery.toLowerCase();
    return products.filter(p => 
      p.title.toLowerCase().includes(query) ||
      p.variants.some(v => v.sku?.toLowerCase().includes(query))
    );
  }, [products, searchQuery]);

  // Ajouter les variantes sélectionnées
  const addSelectedVariants = async () => {
    if (!currentShop || !orderId) return;
    
    const variantsToAdd = Object.entries(selectedVariants)
      .filter(([_, qty]) => qty > 0)
      .map(([variantId, quantity]) => {
        // Trouver le produit et la variante
        for (const product of products) {
          const variant = product.variants.find(v => v.id === variantId);
          if (variant) {
            return {
              variant_id: variant.id,
              product_title: product.title,
              variant_title: variant.title,
              sku: variant.sku,
              quantity,
            };
          }
        }
        return null;
      })
      .filter(Boolean);

    if (variantsToAdd.length === 0) {
      notifications.show({
        title: 'Attention',
        message: 'Sélectionnez au moins une variante',
        color: 'orange',
      });
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/suppliers/orders/${orderId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId: currentShop.id,
          items: variantsToAdd,
        }),
      });

      if (response.ok) {
        notifications.show({
          title: 'Succès',
          message: `${variantsToAdd.length} article(s) ajouté(s)`,
          color: 'green',
        });
        closeAddModal();
        fetchOrder();
      }
    } catch (err) {
      console.error('Error adding items:', err);
      notifications.show({
        title: 'Erreur',
        message: 'Impossible d\'ajouter les articles',
        color: 'red',
      });
    } finally {
      setSaving(false);
    }
  };

  // Supprimer un article
  const deleteItem = async (itemId: string) => {
    if (!currentShop) return;
    
    try {
      const response = await fetch(`/api/suppliers/orders/${orderId}/items?itemId=${itemId}&shopId=${currentShop.id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setItems(prev => prev.filter(i => i.id !== itemId));
        notifications.show({
          title: 'Succès',
          message: 'Article supprimé',
          color: 'green',
        });
      }
    } catch (err) {
      console.error('Error deleting item:', err);
    }
  };

  // Valider/Dévalider un article
  const toggleValidation = async (itemId: string, isValidated: boolean) => {
    if (!currentShop) return;
    
    try {
      const response = await fetch(`/api/suppliers/orders/${orderId}/items`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId: currentShop.id,
          itemId,
          is_validated: isValidated,
        }),
      });
      
      if (response.ok) {
        setItems(prev => prev.map(i => 
          i.id === itemId 
            ? { ...i, is_validated: isValidated, validated_at: isValidated ? new Date().toISOString() : null }
            : i
        ));
      }
    } catch (err) {
      console.error('Error updating item:', err);
    }
  };

  // Sauvegarder les modifications de la commande
  const saveOrder = async () => {
    if (!currentShop || !order) return;
    
    setSaving(true);
    try {
      const response = await fetch('/api/suppliers/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: order.id,
          shopId: currentShop.id,
          note,
          balance_adjustment: balanceAdjustment,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setOrder(data.order);
        notifications.show({
          title: 'Succès',
          message: 'Commande sauvegardée',
          color: 'green',
        });
      }
    } catch (err) {
      console.error('Error saving order:', err);
      notifications.show({
        title: 'Erreur',
        message: 'Impossible de sauvegarder',
        color: 'red',
      });
    } finally {
      setSaving(false);
    }
  };

  // Fermer le batch
  const closeBatch = async () => {
    if (!currentShop || !order) return;
    if (!confirm('Êtes-vous sûr de vouloir fermer ce batch ? Cette action est irréversible.')) return;
    
    setSaving(true);
    try {
      const response = await fetch('/api/suppliers/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: order.id,
          shopId: currentShop.id,
          status: 'completed',
        }),
      });
      
      if (response.ok) {
        notifications.show({
          title: 'Succès',
          message: 'Batch fermé avec succès',
          color: 'green',
        });
        router.push('/ivy/suppliers');
      }
    } catch (err) {
      console.error('Error closing batch:', err);
      notifications.show({
        title: 'Erreur',
        message: 'Impossible de fermer le batch',
        color: 'red',
      });
    } finally {
      setSaving(false);
    }
  };

  // Grouper les articles par préfixe SKU
  const groupedItems = useMemo(() => {
    const groups: Record<string, OrderItem[]> = {};
    
    items.forEach(item => {
      const prefix = item.sku?.match(/^([A-Za-z]+)/)?.[1]?.toUpperCase() || 'AUTRES';
      if (!groups[prefix]) {
        groups[prefix] = [];
      }
      groups[prefix].push(item);
    });
    
    // Trier chaque groupe par SKU
    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => (a.sku || '').localeCompare(b.sku || ''));
    });
    
    return groups;
  }, [items]);

  // Calculer les totaux
  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + item.line_total, 0);
    const totalHt = subtotal + balanceAdjustment;
    const totalTtc = totalHt * 1.2;
    const validatedCount = items.filter(i => i.is_validated).length;
    const progress = items.length > 0 ? (validatedCount / items.length) * 100 : 0;
    
    return { subtotal, totalHt, totalTtc, validatedCount, progress };
  }, [items, balanceAdjustment]);

  if (loading) {
    return (
      <Center h={400}>
        <Loader size="lg" />
      </Center>
    );
  }

  if (!order) {
    return (
      <Center h={400}>
        <Text c="dimmed">Commande non trouvée</Text>
      </Center>
    );
  }

  const isCompleted = order.status === 'completed';

  return (
    <div className={styles.container}>
      {/* Header */}
      <Group justify="space-between" mb="lg">
        <Group>
          <Button
            variant="subtle"
            color="gray"
            leftSection={<IconArrowLeft size={18} />}
            onClick={() => router.push('/ivy/suppliers')}
          >
            Retour
          </Button>
          <Title order={2}>{order.order_number}</Title>
          <Badge 
            color={isCompleted ? 'green' : order.status === 'in_progress' ? 'blue' : 'gray'}
            size="lg"
          >
            {isCompleted ? 'Terminée' : order.status === 'in_progress' ? 'En cours' : 'Brouillon'}
          </Badge>
        </Group>
        
        {!isCompleted && (
          <Group>
            <Button
              variant="light"
              leftSection={<IconPlus size={18} />}
              onClick={handleOpenAddModal}
            >
              Ajouter des articles
            </Button>
            <Button
              leftSection={<IconDeviceFloppy size={18} />}
              onClick={saveOrder}
              loading={saving}
            >
              Sauvegarder
            </Button>
            <Button
              color="green"
              leftSection={<IconLock size={18} />}
              onClick={closeBatch}
              disabled={items.length === 0}
            >
              Fermer le batch
            </Button>
          </Group>
        )}
      </Group>

      {/* Progression */}
      <Paper withBorder p="md" radius="md" mb="lg">
        <Group justify="space-between" mb="xs">
          <Text fw={600}>Progression de validation</Text>
          <Text size="sm" c="dimmed">
            {totals.validatedCount} / {items.length} articles validés
          </Text>
        </Group>
        <Progress value={totals.progress} size="lg" color="green" />
      </Paper>

      {/* Note */}
      <Paper withBorder p="md" radius="md" mb="lg">
        <Textarea
          label="Note de commande"
          placeholder="Ajouter une note..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          disabled={isCompleted}
          rows={2}
        />
      </Paper>

      {/* Articles groupés par SKU */}
      {Object.keys(groupedItems).length > 0 ? (
        Object.entries(groupedItems).map(([prefix, groupItems]) => (
          <Paper key={prefix} withBorder radius="md" mb="lg">
            <div className={styles.groupHeader}>
              <Group>
                <IconPackage size={20} />
                <Text fw={600}>{prefix}</Text>
                <Badge variant="light">{groupItems.length} article(s)</Badge>
              </Group>
            </div>
            <Table striped>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th style={{ width: 50 }}>Validé</Table.Th>
                  <Table.Th>Produit</Table.Th>
                  <Table.Th>Variante</Table.Th>
                  <Table.Th>SKU</Table.Th>
                  <Table.Th style={{ textAlign: 'right' }}>Qté</Table.Th>
                  <Table.Th style={{ textAlign: 'right' }}>Prix unit.</Table.Th>
                  <Table.Th style={{ textAlign: 'right' }}>Total</Table.Th>
                  {!isCompleted && <Table.Th style={{ width: 50 }}></Table.Th>}
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {groupItems.map((item) => (
                  <Table.Tr key={item.id} className={item.is_validated ? styles.validatedRow : ''}>
                    <Table.Td>
                      <Checkbox
                        checked={item.is_validated}
                        onChange={(e) => toggleValidation(item.id, e.currentTarget.checked)}
                        disabled={isCompleted}
                      />
                    </Table.Td>
                    <Table.Td>{item.product_title}</Table.Td>
                    <Table.Td>{item.variant_title || '-'}</Table.Td>
                    <Table.Td>
                      <Badge variant="light" color="gray">{item.sku || '-'}</Badge>
                    </Table.Td>
                    <Table.Td style={{ textAlign: 'right' }}>{item.quantity}</Table.Td>
                    <Table.Td style={{ textAlign: 'right' }}>{item.unit_price.toFixed(2)} €</Table.Td>
                    <Table.Td style={{ textAlign: 'right', fontWeight: 600 }}>{item.line_total.toFixed(2)} €</Table.Td>
                    {!isCompleted && (
                      <Table.Td>
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          onClick={() => deleteItem(item.id)}
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Table.Td>
                    )}
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Paper>
        ))
      ) : (
        <Paper withBorder p="xl" radius="md" mb="lg">
          <Text c="dimmed" ta="center">
            Aucun article dans cette commande. Cliquez sur "Ajouter des articles" pour commencer.
          </Text>
        </Paper>
      )}

      {/* Facturation */}
      <Paper withBorder p="md" radius="md">
        <Title order={4} mb="md">Facturation</Title>
        <Stack gap="sm">
          <Group justify="space-between">
            <Text>Sous-total</Text>
            <Text fw={600}>{totals.subtotal.toFixed(2)} €</Text>
          </Group>
          <Group justify="space-between" align="flex-end">
            <NumberInput
              label="Balance (ajustement)"
              value={balanceAdjustment}
              onChange={(value) => setBalanceAdjustment(Number(value) || 0)}
              decimalScale={2}
              prefix={balanceAdjustment >= 0 ? '+' : ''}
              suffix=" €"
              disabled={isCompleted}
              style={{ width: 200 }}
            />
            <Text fw={600}>{balanceAdjustment >= 0 ? '+' : ''}{balanceAdjustment.toFixed(2)} €</Text>
          </Group>
          <Divider />
          <Group justify="space-between">
            <Text fw={600}>Total HT</Text>
            <Text fw={600} size="lg">{totals.totalHt.toFixed(2)} €</Text>
          </Group>
          <Group justify="space-between">
            <Text c="dimmed">TVA (20%)</Text>
            <Text c="dimmed">{(totals.totalHt * 0.2).toFixed(2)} €</Text>
          </Group>
          <Divider />
          <Group justify="space-between">
            <Text fw={700} size="lg">Total TTC</Text>
            <Text fw={700} size="xl" c="green">{totals.totalTtc.toFixed(2)} €</Text>
          </Group>
        </Stack>
      </Paper>

      {/* Modal ajout d'articles */}
      <Modal
        opened={addModalOpened}
        onClose={closeAddModal}
        title="Ajouter des articles"
        size="xl"
      >
        <TextInput
          placeholder="Rechercher un produit ou SKU..."
          leftSection={<IconSearch size={16} />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          mb="md"
        />
        
        {loadingProducts ? (
          <Center h={200}>
            <Loader />
          </Center>
        ) : (
          <div className={styles.productsList}>
            {filteredProducts.map((product) => (
              <Paper key={product.id} withBorder p="sm" radius="md" mb="sm">
                <Text fw={600} mb="xs">{product.title}</Text>
                <div className={styles.variantsList}>
                  {product.variants.map((variant) => (
                    <Group key={variant.id} justify="space-between" className={styles.variantRow}>
                      <Group>
                        <Text size="sm">{variant.title}</Text>
                        <Badge size="xs" variant="light">{variant.sku}</Badge>
                      </Group>
                      <NumberInput
                        size="xs"
                        min={0}
                        value={selectedVariants[variant.id] || 0}
                        onChange={(value) => setSelectedVariants(prev => ({
                          ...prev,
                          [variant.id]: Number(value) || 0,
                        }))}
                        style={{ width: 80 }}
                      />
                    </Group>
                  ))}
                </div>
              </Paper>
            ))}
          </div>
        )}
        
        <Group justify="flex-end" mt="md">
          <Button variant="subtle" onClick={closeAddModal}>Annuler</Button>
          <Button 
            onClick={addSelectedVariants}
            loading={saving}
            disabled={Object.values(selectedVariants).every(v => v === 0)}
          >
            Ajouter ({Object.values(selectedVariants).filter(v => v > 0).length} variante(s))
          </Button>
        </Group>
      </Modal>
    </div>
  );
}
