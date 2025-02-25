'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface DisplayConfig {
  default_currency: string;
  date_format: string;
  items_per_page: number;
}

interface SyncConfig {
  orders_sync_interval_minutes: number;
  products_sync_interval_minutes: number;
  max_items_per_sync: number;
  enabled: boolean;
}

interface Settings {
  display_config: DisplayConfig;
  sync_config: SyncConfig;
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data: displayConfigData, error: displayError } = await supabase
          .from('settings')
          .select('value')
          .eq('key', 'display_config')
          .single();

        const { data: syncConfigData, error: syncError } = await supabase
          .from('settings')
          .select('value')
          .eq('key', 'sync_config')
          .single();

        if (displayError || syncError) {
          throw new Error('Failed to fetch settings');
        }

        setSettings({
          display_config: displayConfigData?.value as DisplayConfig,
          sync_config: syncConfigData?.value as SyncConfig,
        });
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setIsLoading(false);
      }
    };

    // Initial fetch
    fetchSettings();

    // Subscribe to changes
    const settingsSubscription = supabase
      .channel('settings_channel')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'settings'
        },
        () => {
          fetchSettings();
        }
      )
      .subscribe();

    return () => {
      settingsSubscription.unsubscribe();
    };
  }, []);

  const updateSettings = async (newSettings: Partial<Settings>) => {
    try {
      if (newSettings.display_config) {
        const { error: displayError } = await supabase
          .from('settings')
          .update({ value: newSettings.display_config })
          .eq('key', 'display_config');

        if (displayError) throw displayError;
      }

      if (newSettings.sync_config) {
        const { error: syncError } = await supabase
          .from('settings')
          .update({ value: newSettings.sync_config })
          .eq('key', 'sync_config');

        if (syncError) throw syncError;
      }

      // Mise à jour locale
      setSettings(prev => prev ? { ...prev, ...newSettings } : newSettings);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update settings'));
      throw err;
    }
  };

  return {
    settings,
    isLoading,
    error,
    updateSettings,
  };
}
