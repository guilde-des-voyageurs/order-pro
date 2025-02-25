'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/state/AuthProvider';
import { auth } from '@/firebase/config';
import { updateProfile } from 'firebase/auth';
import { db } from '@/firebase/config';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';

interface UserPreferences {
  notifications_enabled: boolean;
  theme: 'light' | 'dark';
}

interface UserProfile {
  full_name: string;
  email: string;
  avatar_url?: string;
  preferences: UserPreferences;
}

export function useUser() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    // Écouter les changements du profil dans Firestore
    const unsubscribe = onSnapshot(
      doc(db, 'users', user.uid),
      (doc) => {
        if (doc.exists()) {
          setProfile(doc.data() as UserProfile);
        }
        setLoading(false);
      },
      (err) => {
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!user) throw new Error('Not authenticated');

    try {
      // Mettre à jour le profil Firebase Auth si nécessaire
      if (data.full_name) {
        await updateProfile(user, { displayName: data.full_name });
      }

      // Mettre à jour le profil Firestore
      await setDoc(doc(db, 'users', user.uid), {
        ...profile,
        ...data,
      }, { merge: true });
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  const updateUserPreferences = async (preferences: Partial<UserPreferences>) => {
    if (!user || !profile) throw new Error('Not authenticated');

    try {
      await setDoc(doc(db, 'users', user.uid), {
        ...profile,
        preferences: {
          ...profile.preferences,
          ...preferences,
        },
      }, { merge: true });
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  const updateUserAvatar = async (file: File) => {
    if (!user) throw new Error('Not authenticated');

    try {
      // Implémenter le stockage de l'avatar avec Firebase Storage
      // Pour l'instant, on ne fait rien
      console.warn('Avatar upload not implemented yet');
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  return {
    user: profile,
    isLoading: loading || authLoading,
    error,
    updateProfile: updateUserProfile,
    updatePreferences: updateUserPreferences,
    updateAvatar: updateUserAvatar,
  };
}
