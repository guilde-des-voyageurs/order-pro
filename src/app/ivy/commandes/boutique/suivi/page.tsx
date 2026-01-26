'use client';

import { Title, Text, Paper, Center } from '@mantine/core';
import { IconChecklist } from '@tabler/icons-react';

export default function SuiviInternePage() {
  return (
    <div style={{ padding: '1.5rem' }}>
      <Title order={2} mb="lg">
        <IconChecklist size={28} style={{ marginRight: 8, verticalAlign: 'middle' }} />
        Suivi interne
      </Title>
      
      <Text c="dimmed" mb="lg">
        Suivi des commandes avec checkboxes pour le traitement interne.
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
