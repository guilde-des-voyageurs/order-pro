'use client';

import { Title, Text, Paper } from '@mantine/core';

export default function InventoryPage() {
  return (
    <div>
      <Title order={1} mb="xl">Inventaire</Title>
      <Paper p="xl" withBorder radius="md">
        <Text size="lg" c="dimmed" ta="center">
          🚧 Page en cours de développement
        </Text>
      </Paper>
    </div>
  );
}
