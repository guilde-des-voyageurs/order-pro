'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { usersService } from '@/services/users';

export function useUser() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await usersService.getCurrentUser();
        setUser(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch user'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN') {
        fetchUser();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    // Subscribe to profile changes
    const profileSubscription = supabase
      .channel('user_profiles_channel')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_profiles',
          filter: user?.id ? `id=eq.${user.id}` : undefined
        },
        () => {
          fetchUser();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
      profileSubscription.unsubscribe();
    };
  }, []);

  const updateProfile = async (updates: Partial<typeof user>) => {
    if (!user?.id) return;

    try {
      await usersService.updateProfile(user.id, updates);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update profile'));
      throw err;
    }
  };

  const updatePreferences = async (preferences: Partial<typeof user.preferences>) => {
    if (!user?.id) return;

    try {
      await usersService.updatePreferences(user.id, preferences);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update preferences'));
      throw err;
    }
  };

  const updateAvatar = async (file: File) => {
    if (!user?.id) return;

    try {
      const publicUrl = await usersService.updateAvatar(user.id, file);
      return publicUrl;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update avatar'));
      throw err;
    }
  };

  return {
    user,
    isLoading,
    error,
    updateProfile,
    updatePreferences,
    updateAvatar,
  };
}
