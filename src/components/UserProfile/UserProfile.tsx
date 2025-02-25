'use client';

import { useState } from 'react';
import { Card, Avatar, Text, Group, Stack, TextInput, Switch, Button, FileButton } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useUser } from '@/hooks/useUser';

export function UserProfile() {
  const { user, isLoading, error, updateProfile, updatePreferences, updateAvatar } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
  });

  if (isLoading) {
    return <Text>Chargement du profil...</Text>;
  }

  if (error) {
    return <Text c="red">Erreur : {error.message}</Text>;
  }

  if (!user) {
    return <Text>Utilisateur non connecté</Text>;
  }

  const handleEdit = () => {
    setFormData({
      full_name: user.full_name,
      email: user.email,
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      await updateProfile(formData);
      setIsEditing(false);
      notifications.show({
        title: 'Succès',
        message: 'Profil mis à jour avec succès',
        color: 'green',
      });
    } catch (err) {
      notifications.show({
        title: 'Erreur',
        message: 'Impossible de mettre à jour le profil',
        color: 'red',
      });
    }
  };

  const handleAvatarUpload = async (file: File) => {
    try {
      await updateAvatar(file);
      notifications.show({
        title: 'Succès',
        message: 'Avatar mis à jour avec succès',
        color: 'green',
      });
    } catch (err) {
      notifications.show({
        title: 'Erreur',
        message: 'Impossible de mettre à jour l\'avatar',
        color: 'red',
      });
    }
  };

  const handlePreferenceChange = async (key: string, value: boolean) => {
    try {
      await updatePreferences({ [key]: value });
      notifications.show({
        title: 'Succès',
        message: 'Préférences mises à jour avec succès',
        color: 'green',
      });
    } catch (err) {
      notifications.show({
        title: 'Erreur',
        message: 'Impossible de mettre à jour les préférences',
        color: 'red',
      });
    }
  };

  return (
    <Stack>
      <Card withBorder>
        <Group>
          <Stack align="center">
            <Avatar
              src={user.avatar_url}
              size="xl"
              radius="xl"
            />
            <FileButton
              onChange={handleAvatarUpload}
              accept="image/png,image/jpeg"
            >
              {(props) => (
                <Button variant="light" {...props}>
                  Changer l&apos;avatar
                </Button>
              )}
            </FileButton>
          </Stack>

          <Stack style={{ flex: 1 }}>
            {isEditing ? (
              <>
                <TextInput
                  label="Nom complet"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                />
                <TextInput
                  label="Email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                <Group>
                  <Button onClick={handleSave}>Enregistrer</Button>
                  <Button variant="light" onClick={() => setIsEditing(false)}>Annuler</Button>
                </Group>
              </>
            ) : (
              <>
                <Text size="xl" fw={500}>{user.full_name}</Text>
                <Text c="dimmed">{user.email}</Text>
                <Text size="sm">Rôle : {user.role}</Text>
                <Button variant="light" onClick={handleEdit}>Modifier</Button>
              </>
            )}
          </Stack>
        </Group>
      </Card>

      <Card withBorder>
        <Stack>
          <Text fw={500} size="lg">Préférences</Text>

          <Switch
            label="Thème sombre"
            checked={user.preferences.theme === 'dark'}
            onChange={(event) => handlePreferenceChange('theme', event.currentTarget.checked ? 'dark' : 'light')}
          />

          <Switch
            label="Notifications dans l'application"
            checked={user.preferences.notifications_enabled}
            onChange={(event) => handlePreferenceChange('notifications_enabled', event.currentTarget.checked)}
          />

          <Switch
            label="Notifications par email"
            checked={user.preferences.email_notifications}
            onChange={(event) => handlePreferenceChange('email_notifications', event.currentTarget.checked)}
          />
        </Stack>
      </Card>
    </Stack>
  );
}
