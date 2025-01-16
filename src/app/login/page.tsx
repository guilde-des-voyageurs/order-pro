'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TextInput, Button, Paper, Title, Container, Text } from '@mantine/core';
import { useAuthContext } from '@/context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { signIn } = useAuthContext();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const result = await signIn(email, password);
    if (result.error) {
      setError(result.error);
    } else {
      router.push('/');
    }
  };

  return (
    <Container size={420} my={40}>
      <Title ta="center">Bienvenue sur OrderPro</Title>
      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <form onSubmit={handleSubmit}>
          <TextInput
            label="Email"
            placeholder="vous@exemple.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextInput
            label="Mot de passe"
            type="password"
            required
            mt="md"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && (
            <Text c="red" size="sm" mt="sm">
              {error}
            </Text>
          )}
          <Button type="submit" fullWidth mt="xl">
            Se connecter
          </Button>
        </form>
      </Paper>
    </Container>
  );
}
