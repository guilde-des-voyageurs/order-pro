'use client';

import { Title, Text, Paper, Center } from '@mantine/core';
import { IconShoppingCart } from '@tabler/icons-react';

export default function CommandesBoutiquePage() {
  return (
    <div style={{ padding: '1.5rem' }}>
      <Title order={2} mb="lg">
        <IconShoppingCart size={28} style={{ marginRight: 8, verticalAlign: 'middle' }} />
        Commandes boutique
      </Title>
      
      <Text c="dimmed" mb="lg">
        Liste des commandes clients de votre boutique Shopify.
      </Text>

      <Paper withBorder p="xl" radius="md">
        <Center>
          <Text c="dimmed">
            🚧 Cette section sera reconstruite prochainement. 
            Les anciennes pages sont archivées dans _archive/ pour référence.
          </Text>
        </Center>
      </Paper>
    </div>
  );
}
