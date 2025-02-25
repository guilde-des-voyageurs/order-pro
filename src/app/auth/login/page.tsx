'use client';

import { useState } from 'react';
import { TextInput, Button, Paper, Title, Container } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('LoginPage - attempting login with:', { email });
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      console.log('LoginPage - login successful:', data);
      notifications.show({
        title: 'Connexion réussie',
        message: 'Vous êtes maintenant connecté',
        color: 'green',
      });

      router.replace('/');
    } catch (error) {
      console.error('LoginPage - error logging in:', error);
      notifications.show({
        title: 'Erreur',
        message: error instanceof Error ? error.message : 'Une erreur est survenue lors de la connexion',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size={420} my={40}>
      <Title ta="center" mb="xl">Runes de Chêne</Title>

      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <form onSubmit={handleSubmit}>
          <TextInput
            label="Email"
            placeholder="votre@email.com"
            required
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
            mb="md"
          />
          <TextInput
            label="Mot de passe"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.currentTarget.value)}
            mb="xl"
          />
          <Button 
            type="submit" 
            fullWidth 
            loading={loading}
            color="blue"
          >
            Se connecter
          </Button>
        </form>
      </Paper>
    </Container>
  );
}
