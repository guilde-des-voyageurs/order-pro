'use client';

import { Container, Title, Text, Button, Group } from '@mantine/core';
import { useRouter } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();

  return (
    <Container size={420} my={40}>
      <Title ta="center">Page non trouvée</Title>
      <Text c="dimmed" size="lg" ta="center" mt="xl">
        La page que vous recherchez n&apos;existe pas ou a été déplacée.
      </Text>
      <Group justify="center" mt="xl">
        <Button onClick={() => router.push('/')}>
          Retour à l&apos;accueil
        </Button>
      </Group>
    </Container>
  );
}
