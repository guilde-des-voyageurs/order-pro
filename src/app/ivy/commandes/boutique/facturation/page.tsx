'use client';

import { Title, Text, Paper, Center } from '@mantine/core';
import { IconFileInvoice } from '@tabler/icons-react';

export default function FacturationBoutiquePage() {
  return (
    <div style={{ padding: '1.5rem' }}>
      <Title order={2} mb="lg">
        <IconFileInvoice size={28} style={{ marginRight: 8, verticalAlign: 'middle' }} />
        Facturation boutique
      </Title>
      
      <Text c="dimmed" mb="lg">
        Gestion de la facturation des commandes clients.
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
