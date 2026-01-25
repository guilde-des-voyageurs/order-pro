'use client';

import { useState, useEffect, useCallback } from 'react';
import { Title, Text, Paper, Tabs, Table, Button, Group, Badge, ActionIcon, Modal, TextInput, Textarea, Loader, Center } from '@mantine/core';
import { IconPlus, IconEye, IconTrash, IconPackage, IconCheck, IconClock } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useDisclosure } from '@mantine/hooks';
import { useRouter } from 'next/navigation';
import { useShop } from '@/context/ShopContext';
import styles from './suppliers.module.scss';

interface SupplierOrder {
  id: string;
  order_number: string;
  status: 'draft' | 'requested' | 'produced' | 'completed';
  note: string | null;
  subtotal: number;
  balance_adjustment: number;
  total_ht: number;
  total_ttc: number;
  created_at: string;
  closed_at: string | null;
  items_count?: number;
  validated_count?: number;
}

export default function SuppliersPage() {
  const router = useRouter();
  const { currentShop } = useShop();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<SupplierOrder[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>('active');
  const [createModalOpened, { open: openCreateModal, close: closeCreateModal }] = useDisclosure(false);
  const [newOrderNote, setNewOrderNote] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchOrders = useCallback(async () => {
    if (!currentShop) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/suppliers/orders?shopId=${currentShop.id}`);
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      notifications.show({
        title: 'Erreur',
        message: 'Impossible de charger les commandes',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  }, [currentShop]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const createOrder = async () => {
    if (!currentShop) return;
    
    setCreating(true);
    try {
      const response = await fetch('/api/suppliers/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId: currentShop.id,
          note: newOrderNote,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        notifications.show({
          title: 'Succès',
          message: `Commande ${data.order.order_number} créée`,
          color: 'green',
        });
        closeCreateModal();
        setNewOrderNote('');
        // Rediriger vers la page de détail pour ajouter des articles
        router.push(`/ivy/suppliers/${data.order.id}`);
      } else {
        throw new Error('Failed to create order');
      }
    } catch (err) {
      console.error('Error creating order:', err);
      notifications.show({
        title: 'Erreur',
        message: 'Impossible de créer la commande',
        color: 'red',
      });
    } finally {
      setCreating(false);
    }
  };

  const deleteOrder = async (orderId: string) => {
    if (!currentShop) return;
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette commande ?')) return;
    
    try {
      const response = await fetch(`/api/suppliers/orders?id=${orderId}&shopId=${currentShop.id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        notifications.show({
          title: 'Succès',
          message: 'Commande supprimée',
          color: 'green',
        });
        fetchOrders();
      }
    } catch (err) {
      console.error('Error deleting order:', err);
    }
  };

  const filteredOrders = orders.filter(order => {
    if (activeTab === 'active') {
      return order.status !== 'completed';
    }
    return order.status === 'completed';
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge color="gray" leftSection={<IconClock size={12} />}>Brouillon</Badge>;
      case 'requested':
        return <Badge color="blue" leftSection={<IconPackage size={12} />}>Demandée</Badge>;
      case 'produced':
        return <Badge color="teal" leftSection={<IconCheck size={12} />}>Produite</Badge>;
      case 'completed':
        return <Badge color="green" leftSection={<IconCheck size={12} />}>Terminée</Badge>;
      default:
        return <Badge>{status}</Badge>;
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
      <Group justify="space-between" mb="lg">
        <Title order={2}>Commandes Fournisseur</Title>
        <Button
          leftSection={<IconPlus size={18} />}
          onClick={openCreateModal}
        >
          Nouvelle commande
        </Button>
      </Group>

      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List mb="lg">
          <Tabs.Tab value="active" leftSection={<IconPackage size={16} />}>
            En cours ({orders.filter(o => o.status !== 'completed').length})
          </Tabs.Tab>
          <Tabs.Tab value="completed" leftSection={<IconCheck size={16} />}>
            Terminées ({orders.filter(o => o.status === 'completed').length})
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="active">
          <OrdersTable 
            orders={filteredOrders} 
            onView={(id) => router.push(`/ivy/suppliers/${id}`)}
            onDelete={deleteOrder}
            formatDate={formatDate}
            getStatusBadge={getStatusBadge}
          />
        </Tabs.Panel>

        <Tabs.Panel value="completed">
          <OrdersTable 
            orders={filteredOrders} 
            onView={(id) => router.push(`/ivy/suppliers/${id}`)}
            onDelete={deleteOrder}
            formatDate={formatDate}
            getStatusBadge={getStatusBadge}
          />
        </Tabs.Panel>
      </Tabs>

      {/* Modal création */}
      <Modal
        opened={createModalOpened}
        onClose={closeCreateModal}
        title="Nouvelle commande fournisseur"
      >
        <Textarea
          label="Note (optionnel)"
          placeholder="Ajouter une note pour cette commande..."
          value={newOrderNote}
          onChange={(e) => setNewOrderNote(e.target.value)}
          rows={3}
          mb="md"
        />
        <Group justify="flex-end">
          <Button variant="subtle" onClick={closeCreateModal}>Annuler</Button>
          <Button onClick={createOrder} loading={creating}>
            Créer et ajouter des articles
          </Button>
        </Group>
      </Modal>
    </div>
  );
}

interface OrdersTableProps {
  orders: SupplierOrder[];
  onView: (id: string) => void;
  onDelete: (id: string) => void;
  formatDate: (date: string) => string;
  getStatusBadge: (status: string) => React.ReactNode;
}

function OrdersTable({ orders, onView, onDelete, formatDate, getStatusBadge }: OrdersTableProps) {
  if (orders.length === 0) {
    return (
      <Paper withBorder p="xl" radius="md">
        <Text c="dimmed" ta="center">
          Aucune commande dans cette catégorie
        </Text>
      </Paper>
    );
  }

  return (
    <Paper withBorder radius="md">
      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>N° Commande</Table.Th>
            <Table.Th>Date</Table.Th>
            <Table.Th>Statut</Table.Th>
            <Table.Th>Articles</Table.Th>
            <Table.Th>Total TTC</Table.Th>
            <Table.Th>Note</Table.Th>
            <Table.Th style={{ width: 100 }}>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {orders.map((order) => (
            <Table.Tr key={order.id}>
              <Table.Td fw={600}>{order.order_number}</Table.Td>
              <Table.Td>{formatDate(order.created_at)}</Table.Td>
              <Table.Td>{getStatusBadge(order.status)}</Table.Td>
              <Table.Td>
                {order.items_count !== undefined && (
                  <Text size="sm">
                    {order.validated_count || 0} / {order.items_count}
                  </Text>
                )}
              </Table.Td>
              <Table.Td fw={600}>{order.total_ttc.toFixed(2)} €</Table.Td>
              <Table.Td>
                <Text size="sm" c="dimmed" lineClamp={1}>
                  {order.note || '-'}
                </Text>
              </Table.Td>
              <Table.Td>
                <Group gap="xs">
                  <ActionIcon
                    variant="subtle"
                    color="blue"
                    onClick={() => onView(order.id)}
                  >
                    <IconEye size={18} />
                  </ActionIcon>
                  {order.status !== 'completed' && (
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      onClick={() => onDelete(order.id)}
                    >
                      <IconTrash size={18} />
                    </ActionIcon>
                  )}
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Paper>
  );
}
