'use client';

import { Title, Text, Paper, SimpleGrid, Group, ThemeIcon, Stack } from '@mantine/core';
import { IconPackage, IconTruck, IconChartBar, IconLeaf } from '@tabler/icons-react';
import { useShop } from '@/context/ShopContext';

export default function IvyPage() {
  const { currentShop } = useShop();

  const features = [
    {
      icon: IconPackage,
      title: 'Inventaire',
      description: 'Gérez votre stock de produits et matières premières',
      color: 'green',
    },
    {
      icon: IconTruck,
      title: 'Fournisseurs',
      description: 'Suivez vos fournisseurs et vos commandes',
      color: 'blue',
    },
    {
      icon: IconChartBar,
      title: 'Statistiques',
      description: 'Analysez vos ventes et votre performance',
      color: 'orange',
    },
  ];

  return (
    <div>
      <Group gap="md" mb="xl">
        <ThemeIcon size={48} radius="md" variant="light" color="green">
          <IconLeaf size={28} />
        </ThemeIcon>
        <div>
          <Title order={1}>IVY</Title>
          <Text c="dimmed">
            Gestion d'inventaire pour {currentShop?.name || 'votre boutique'}
          </Text>
        </div>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
        {features.map((feature) => (
          <Paper key={feature.title} p="xl" withBorder radius="md">
            <Stack gap="md">
              <ThemeIcon size={40} radius="md" variant="light" color={feature.color}>
                <feature.icon size={24} />
              </ThemeIcon>
              <div>
                <Text fw={600} size="lg">{feature.title}</Text>
                <Text c="dimmed" size="sm">{feature.description}</Text>
              </div>
            </Stack>
          </Paper>
        ))}
      </SimpleGrid>

      <Paper p="xl" withBorder mt="xl" radius="md">
        <Text size="lg" c="dimmed" ta="center">
          🚧 Module en cours de développement
        </Text>
      </Paper>
    </div>
  );
}
