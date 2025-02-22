'use client';

import { Button, Group } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { getAuth, signInWithPopup, signOut, GoogleAuthProvider } from 'firebase/auth';
import { useAuthState } from 'react-firebase-hooks/auth';
import { IconLogin, IconLogout } from '@tabler/icons-react';

export function AuthButton() {
  const [user, loading] = useAuthState(getAuth());

  const handleSignIn = async () => {
    try {
      const auth = getAuth();
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      notifications.show({
        title: 'Connexion réussie',
        message: 'Vous êtes maintenant connecté',
        color: 'green',
      });
    } catch (error) {
      console.error('Error signing in:', error);
      notifications.show({
        title: 'Erreur de connexion',
        message: 'Une erreur est survenue lors de la connexion',
        color: 'red',
      });
    }
  };

  const handleSignOut = async () => {
    try {
      const auth = getAuth();
      await signOut(auth);
      notifications.show({
        title: 'Déconnexion réussie',
        message: 'Vous êtes maintenant déconnecté',
        color: 'blue',
      });
    } catch (error) {
      console.error('Error signing out:', error);
      notifications.show({
        title: 'Erreur de déconnexion',
        message: 'Une erreur est survenue lors de la déconnexion',
        color: 'red',
      });
    }
  };

  if (loading) {
    return (
      <Button variant="light" size="compact-sm" loading>
        Chargement...
      </Button>
    );
  }

  if (user) {
    return (
      <Group gap="xs">
        <Button
          variant="light"
          size="compact-sm"
          color="blue"
          onClick={handleSignOut}
          leftSection={<IconLogout size={16} />}
        >
          Se déconnecter
        </Button>
      </Group>
    );
  }

  return (
    <Button
      variant="light"
      size="compact-sm"
      color="blue"
      onClick={handleSignIn}
      leftSection={<IconLogin size={16} />}
    >
      Se connecter
    </Button>
  );
}
