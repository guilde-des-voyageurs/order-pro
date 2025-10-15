'use client';

import { Title, Text, Paper } from '@mantine/core';

export default function IvyPage() {
  return (
    <div>
      <Title order={1} mb="xl">Bienvenue sur IVY</Title>
      <Paper p="xl" withBorder>
        <Text size="lg" c="dimmed">
          Cette section est en cours de développement.
        </Text>
      </Paper>
    </div>
  );
}
