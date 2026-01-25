'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { TextInput, Button, Paper, Title, Stack, Alert, Text, Anchor, PasswordInput } from '@mantine/core';
import { IconAlertCircle, IconCheck } from '@tabler/icons-react';
import styles from '../login/login.module.scss';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);

    try {
      const { error } = await signUp(email, password);
      if (error) {
        if (error.message.includes('already registered')) {
          setError('Cet email est déjà utilisé');
        } else {
          setError('Erreur lors de la création du compte');
        }
      } else {
        setSuccess(true);
        // Rediriger vers l'onboarding après inscription
        setTimeout(() => {
          router.push('/onboarding');
        }, 2000);
      }
    } catch (error) {
      setError('Erreur lors de la création du compte');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <Paper className={styles.formContainer} shadow="md" p="xl">
        <Title order={2} mb="lg">Créer un compte Ivy</Title>
        
        {error && (
          <Alert icon={<IconAlertCircle size={16} />} color="red" mb="md">
            {error}
          </Alert>
        )}

        {success && (
          <Alert icon={<IconCheck size={16} />} color="green" mb="md">
            Compte créé avec succès ! Redirection...
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Stack>
            <TextInput
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={success}
            />
            
            <PasswordInput
              label="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={success}
            />

            <PasswordInput
              label="Confirmer le mot de passe"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={success}
            />

            <Button type="submit" loading={loading} disabled={success}>
              Créer mon compte
            </Button>

            <Text size="sm" ta="center">
              Déjà un compte ?{' '}
              <Anchor component={Link} href="/login">
                Se connecter
              </Anchor>
            </Text>
          </Stack>
        </form>
      </Paper>
    </div>
  );
}
