'use client';

import { useState, useEffect } from 'react';
import { Card, Table, Text, Badge, Group, Select, Stack } from '@mantine/core';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { syncService } from '@/services/sync';

interface SyncLog {
  id: string;
  type: 'orders' | 'products';
  status: 'pending' | 'success' | 'error';
  items_processed: number;
  items_succeeded: number;
  items_failed: number;
  error_message?: string;
  started_at: string;
  completed_at?: string;
}

export function SyncHistory() {
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setIsLoading(true);
        const data = await syncService.getSyncLogs(
          filter === 'all' ? undefined : filter as 'orders' | 'products'
        );
        setLogs(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch sync logs'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogs();
  }, [filter]);

  if (error) {
    return <Text c="red">Erreur : {error.message}</Text>;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'blue';
      case 'success':
        return 'green';
      case 'error':
        return 'red';
      default:
        return 'gray';
    }
  };

  const formatDate = (date: string) => {
    return format(new Date(date), 'dd/MM/yyyy HH:mm:ss', { locale: fr });
  };

  const getDuration = (startDate: string, endDate?: string) => {
    if (!endDate) return 'En cours...';
    const start = new Date(startDate);
    const end = new Date(endDate);
    const seconds = Math.floor((end.getTime() - start.getTime()) / 1000);
    return `${seconds} secondes`;
  };

  return (
    <Card withBorder>
      <Stack>
        <Group justify="space-between">
          <Text fw={500} size="lg">Historique des synchronisations</Text>
          <Select
            value={filter}
            onChange={(value) => setFilter(value || 'all')}
            data={[
              { value: 'all', label: 'Tous' },
              { value: 'orders', label: 'Commandes' },
              { value: 'products', label: 'Produits' },
            ]}
          />
        </Group>

        {isLoading ? (
          <Text>Chargement de l'historique...</Text>
        ) : (
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Type</Table.Th>
                <Table.Th>Statut</Table.Th>
                <Table.Th>Démarré le</Table.Th>
                <Table.Th>Durée</Table.Th>
                <Table.Th>Éléments traités</Table.Th>
                <Table.Th>Succès</Table.Th>
                <Table.Th>Échecs</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {logs.map((log) => (
                <Table.Tr key={log.id}>
                  <Table.Td>
                    <Text tt="capitalize">
                      {log.type === 'orders' ? 'Commandes' : 'Produits'}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge color={getStatusColor(log.status)}>
                      {log.status === 'pending' ? 'En cours' :
                       log.status === 'success' ? 'Succès' : 'Erreur'}
                    </Badge>
                  </Table.Td>
                  <Table.Td>{formatDate(log.started_at)}</Table.Td>
                  <Table.Td>{getDuration(log.started_at, log.completed_at)}</Table.Td>
                  <Table.Td>{log.items_processed}</Table.Td>
                  <Table.Td>{log.items_succeeded}</Table.Td>
                  <Table.Td>
                    {log.items_failed > 0 ? (
                      <Group>
                        <Text c="red">{log.items_failed}</Text>
                        {log.error_message && (
                          <Text size="xs" c="dimmed">{log.error_message}</Text>
                        )}
                      </Group>
                    ) : (
                      '0'
                    )}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Stack>
    </Card>
  );
}
