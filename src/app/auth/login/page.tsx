'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TextInput, Button, Group, Stack, Title, Paper } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { auth } from '@/firebase/config';
import { signInWithEmailAndPassword } from 'firebase/auth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/');
    } catch (error) {
      notifications.show({
        title: 'Erreur',
        message: 'Email ou mot de passe incorrect',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack align="center" justify="center" h="100vh" bg="gray.1">
      <Paper shadow="md" p="xl" w={400}>
        <form onSubmit={handleSubmit}>
          <Stack>
            <Title order={2}>Connexion</Title>

            <TextInput
              label="Email"
              placeholder="votre@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <TextInput
              label="Mot de passe"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Group justify="flex-end" mt="md">
              <Button type="submit" loading={loading}>
                Se connecter
              </Button>
            </Group>
          </Stack>
        </form>
      </Paper>
    </Stack>
  );
}
