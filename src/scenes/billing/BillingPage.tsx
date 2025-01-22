'use client';

import styles from './BillingPage.module.scss';
import { Title, Text, Table, Skeleton } from '@mantine/core';
import { useBillingPagePresenter } from './BillingPage.presenter';
import { format } from 'date-fns';
import fr from 'date-fns/locale/fr';

export const BillingPage = () => {
  const { orders, isLoading, error } = useBillingPagePresenter();

  if (error) {
    return (
      <div className={styles.view}>
        <div className={styles.main_content}>
          <Title order={2}>Facturé</Title>
          <Text c="red" mt="md">
            Une erreur est survenue lors du chargement des commandes.
          </Text>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.view}>
      <div className={styles.main_content}>
        <Title order={2}>Facturé</Title>
        <Text size="sm" c="dimmed" mt="xs">
          Commandes depuis le 16 janvier 2025
        </Text>

        {isLoading ? (
          <Skeleton height={200} mt="xl" radius="md" />
        ) : (
          <Table mt="xl" striped highlightOnHover withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Numéro</Table.Th>
                <Table.Th>Date</Table.Th>
                <Table.Th>Région</Table.Th>
                <Table.Th>Statut</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {orders.map((order) => (
                <Table.Tr key={order.id}>
                  <Table.Td>{order.name}</Table.Td>
                  <Table.Td>
                    {format(new Date(order.createdAt), 'dd MMMM yyyy', {
                      locale: fr,
                    })}
                  </Table.Td>
                  <Table.Td>{order.shippingAddress?.formattedArea}</Table.Td>
                  <Table.Td>
                    <Text
                      c={order.status === 'OPEN' ? 'blue' : 'green'}
                      fw={500}
                    >
                      {order.status === 'OPEN' ? 'En cours' : 'Terminée'}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </div>
    </div>
  );
};
