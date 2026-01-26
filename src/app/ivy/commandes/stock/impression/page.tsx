'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Title, Text, Paper, Table, Button, Group, Badge, Checkbox, Loader, Center, Progress, Select } from '@mantine/core';
import { IconPrinter, IconPackage, IconCheck, IconClock } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useShop } from '@/context/ShopContext';
import styles from './impression.module.scss';

interface OrderItem {
  id: string;
  variant_id: string | null;
  product_title: string;
  variant_title: string | null;
  sku: string | null;
  quantity: number;
  is_validated: boolean;
  validated_at: string | null;
  metafields?: Record<string, string>;
}

interface SupplierOrder {
  id: string;
  order_number: string;
  status: 'draft' | 'requested' | 'produced' | 'completed';
  note: string | null;
  created_at: string;
  items_count?: number;
  validated_count?: number;
}

const SIZE_ORDER = ['XXXS', 'XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL', '4XL', '5XL'];

export default function FeuilleImpressionPage() {
  const { currentShop } = useShop();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<SupplierOrder[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  // Charger les commandes en cours (requested ou produced)
  const fetchOrders = useCallback(async () => {
    if (!currentShop) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/suppliers/orders?shopId=${currentShop.id}`);
      if (response.ok) {
        const data = await response.json();
        const activeOrders = (data.orders || []).filter(
          (o: SupplierOrder) => o.status === 'requested' || o.status === 'produced'
        );
        setOrders(activeOrders);
        if (activeOrders.length > 0 && !selectedOrderId) {
          setSelectedOrderId(activeOrders[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  }, [currentShop, selectedOrderId]);

  // Charger les articles de la commande sélectionnée
  const fetchItems = useCallback(async () => {
    if (!currentShop || !selectedOrderId) {
      setItems([]);
      return;
    }
    
    setLoadingItems(true);
    try {
      const response = await fetch(`/api/suppliers/orders/${selectedOrderId}?shopId=${currentShop.id}`);
      if (response.ok) {
        const data = await response.json();
        setItems(data.items || []);
      }
    } catch (err) {
      console.error('Error fetching items:', err);
    } finally {
      setLoadingItems(false);
    }
  }, [currentShop, selectedOrderId]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Grouper les articles par SKU prefix puis par variante
  const groupedItems = useMemo(() => {
    const groups: Record<string, { key: string; items: OrderItem[] }[]> = {};
    
    items.forEach(item => {
      const skuParts = (item.sku || 'SANS-SKU').split('-');
      const prefix = skuParts[0] || 'AUTRES';
      
      if (!groups[prefix]) {
        groups[prefix] = [];
      }
      
      const variantKey = `${item.product_title}|${item.variant_title}|${item.sku}`;
      let variantGroup = groups[prefix].find(g => g.key === variantKey);
      
      if (!variantGroup) {
        variantGroup = { key: variantKey, items: [] };
        groups[prefix].push(variantGroup);
      }
      
      variantGroup.items.push(item);
    });

    // Trier par taille
    Object.values(groups).forEach(variantGroups => {
      variantGroups.sort((a, b) => {
        const aVariant = a.items[0]?.variant_title || '';
        const bVariant = b.items[0]?.variant_title || '';
        
        const aSize = aVariant.split('/').pop()?.trim() || '';
        const bSize = bVariant.split('/').pop()?.trim() || '';
        
        const aIndex = SIZE_ORDER.indexOf(aSize);
        const bIndex = SIZE_ORDER.indexOf(bSize);
        
        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;
        return aVariant.localeCompare(bVariant);
      });
    });

    return groups;
  }, [items]);

  const totals = useMemo(() => {
    const total = items.length;
    const validated = items.filter(i => i.is_validated).length;
    return {
      total,
      validated,
      progress: total > 0 ? (validated / total) * 100 : 0,
    };
  }, [items]);

  const toggleValidation = async (itemId: string, validated: boolean) => {
    if (!currentShop || !selectedOrderId) return;
    
    try {
      const response = await fetch(`/api/suppliers/orders/${selectedOrderId}/items`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId: currentShop.id,
          itemId,
          is_validated: validated,
        }),
      });
      
      if (response.ok) {
        setItems(prev => prev.map(item => 
          item.id === itemId 
            ? { ...item, is_validated: validated, validated_at: validated ? new Date().toISOString() : null }
            : item
        ));
      }
    } catch (err) {
      console.error('Error toggling validation:', err);
    }
  };

  const selectedOrder = orders.find(o => o.id === selectedOrderId);

  if (loading) {
    return (
      <Center h={400}>
        <Loader size="lg" />
      </Center>
    );
  }

  return (
    <div className={styles.container}>
      <Group justify="space-between" mb="lg">
        <Group>
          <IconPrinter size={28} />
          <Title order={2}>Feuille d'impression</Title>
        </Group>
      </Group>

      <Text c="dimmed" mb="lg">
        Vue simplifiée pour l'atelier. Sélectionnez une commande et cochez les articles au fur et à mesure de la production.
      </Text>

      {orders.length === 0 ? (
        <Paper withBorder p="xl" radius="md">
          <Text c="dimmed" ta="center">
            Aucune commande en cours de production.
          </Text>
        </Paper>
      ) : (
        <>
          {/* Sélecteur de commande */}
          <Paper withBorder p="md" radius="md" mb="lg">
            <Group>
              <Select
                label="Commande"
                placeholder="Sélectionner une commande"
                value={selectedOrderId}
                onChange={setSelectedOrderId}
                data={orders.map(o => ({
                  value: o.id,
                  label: `${o.order_number} - ${o.status === 'requested' ? 'Demandée' : 'Produite'} (${o.items_count || 0} articles)`,
                }))}
                style={{ flex: 1, maxWidth: 400 }}
              />
              {selectedOrder && (
                <Badge 
                  color={selectedOrder.status === 'requested' ? 'blue' : 'teal'} 
                  size="lg"
                  mt={24}
                >
                  {selectedOrder.status === 'requested' ? 'Demandée' : 'Produite'}
                </Badge>
              )}
            </Group>
          </Paper>

          {loadingItems ? (
            <Center h={200}>
              <Loader />
            </Center>
          ) : items.length === 0 ? (
            <Paper withBorder p="xl" radius="md">
              <Text c="dimmed" ta="center">
                Aucun article dans cette commande.
              </Text>
            </Paper>
          ) : (
            <>
              {/* Progression */}
              <Paper withBorder p="md" radius="md" mb="lg">
                <Group justify="space-between" mb="xs">
                  <Text fw={600}>Progression</Text>
                  <Text size="sm" c="dimmed">
                    {totals.validated} / {totals.total} articles ({Math.round(totals.progress)}%)
                  </Text>
                </Group>
                <Progress value={totals.progress} size="lg" color="green" />
              </Paper>

              {/* Articles groupés */}
              {Object.entries(groupedItems).map(([prefix, variantGroups]) => (
                <Paper key={prefix} withBorder radius="md" mb="lg">
                  <div className={styles.groupHeader}>
                    <Group>
                      <IconPackage size={20} />
                      <Text fw={600}>{prefix}</Text>
                      <Badge variant="light">
                        {variantGroups.reduce((sum, g) => sum + g.items.length, 0)} article(s)
                      </Badge>
                    </Group>
                  </div>
                  <Table striped>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Validé</Table.Th>
                        <Table.Th>Produit</Table.Th>
                        <Table.Th>SKU</Table.Th>
                        <Table.Th>Variante</Table.Th>
                        <Table.Th>Métachamps</Table.Th>
                        <Table.Th style={{ textAlign: 'center' }}>Qté</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {variantGroups.map((variantGroup) => {
                        const firstItem = variantGroup.items[0];
                        const validatedCount = variantGroup.items.filter(i => i.is_validated).length;
                        const allValidated = validatedCount === variantGroup.items.length;
                        const metafields = firstItem.metafields || {};
                        
                        return (
                          <Table.Tr key={variantGroup.key} className={allValidated ? styles.validatedRow : ''}>
                            <Table.Td>
                              <Group gap={4}>
                                {variantGroup.items.map((item) => (
                                  <Checkbox
                                    key={item.id}
                                    checked={item.is_validated}
                                    onChange={(e) => toggleValidation(item.id, e.currentTarget.checked)}
                                    size="sm"
                                  />
                                ))}
                              </Group>
                            </Table.Td>
                            <Table.Td>{firstItem.product_title}</Table.Td>
                            <Table.Td>
                              <Badge variant="light" color="gray">{firstItem.sku || '-'}</Badge>
                            </Table.Td>
                            <Table.Td>{firstItem.variant_title || '-'}</Table.Td>
                            <Table.Td>
                              {Object.keys(metafields).length > 0 ? (
                                <Group gap={4}>
                                  {Object.entries(metafields).map(([key, value]) => (
                                    <Badge key={key} variant="light" color="violet" size="sm">
                                      {key}: {value}
                                    </Badge>
                                  ))}
                                </Group>
                              ) : (
                                <Text size="xs" c="dimmed">-</Text>
                              )}
                            </Table.Td>
                            <Table.Td style={{ textAlign: 'center' }}>
                              <Text size="sm" fw={500} c={allValidated ? 'green' : 'orange'}>
                                {validatedCount}/{variantGroup.items.length}
                              </Text>
                            </Table.Td>
                          </Table.Tr>
                        );
                      })}
                    </Table.Tbody>
                  </Table>
                </Paper>
              ))}

              {totals.validated === totals.total && totals.total > 0 && (
                <Paper withBorder p="md" radius="md" bg="green.0">
                  <Group justify="center">
                    <IconCheck size={20} color="green" />
                    <Text fw={600} c="green">Production terminée pour cette commande !</Text>
                  </Group>
                </Paper>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
