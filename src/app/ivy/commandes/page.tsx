'use client';

import { Title, Text, Paper, SimpleGrid, Group } from '@mantine/core';
import { IconPrinter, IconTruck } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import styles from './commandes.module.scss';

export default function CommandesPage() {
  const router = useRouter();

  return (
    <div className={styles.container}>
      <Title order={2} mb="lg">Commandes</Title>
      
      <Text c="dimmed" mb="xl">
        Gérez vos commandes fournisseurs et suivez la production en atelier.
      </Text>

      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
        <Paper 
          withBorder 
          p="xl" 
          radius="md" 
          className={styles.card}
          onClick={() => router.push('/ivy/commandes/batch')}
        >
          <Group mb="md">
            <IconPrinter size={32} color="var(--mantine-color-blue-6)" />
            <Title order={3}>Atelier (Impression)</Title>
          </Group>
          <Text c="dimmed">
            Vue simplifiée pour l'imprimeur. Visualisez les articles à produire et cochez-les au fur et à mesure.
          </Text>
        </Paper>

        <Paper 
          withBorder 
          p="xl" 
          radius="md" 
          className={styles.card}
          onClick={() => router.push('/ivy/commandes/fournisseurs')}
        >
          <Group mb="md">
            <IconTruck size={32} color="var(--mantine-color-orange-6)" />
            <Title order={3}>Commandes fournisseurs</Title>
          </Group>
          <Text c="dimmed">
            Créez et gérez vos commandes batch auprès de vos fournisseurs. Suivez les statuts et les coûts.
          </Text>
        </Paper>
      </SimpleGrid>
    </div>
  );
}
