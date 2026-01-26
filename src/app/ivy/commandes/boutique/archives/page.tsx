'use client';

import { Title, Text, Paper, Center } from '@mantine/core';
import { IconArchive } from '@tabler/icons-react';

export default function ArchivesBoutiquePage() {
  return (
    <div style={{ padding: '1.5rem' }}>
      <Title order={2} mb="lg">
        <IconArchive size={28} style={{ marginRight: 8, verticalAlign: 'middle' }} />
        Archives
      </Title>
      
      <Text c="dimmed" mb="lg">
        Commandes archivées de la boutique.
      </Text>

      <Paper withBorder p="xl" radius="md">
        <Center>
          <Text c="dimmed">
            🚧 Cette section sera reconstruite prochainement.
          </Text>
        </Center>
      </Paper>
    </div>
  );
}
