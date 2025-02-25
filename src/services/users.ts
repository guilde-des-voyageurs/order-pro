import { supabase } from '@/lib/supabase';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  role: 'admin' | 'user';
  preferences: {
    theme: 'light' | 'dark';
    notifications_enabled: boolean;
    email_notifications: boolean;
  };
}

export const usersService = {
  /**
   * Récupère le profil de l'utilisateur courant
   */
  async getCurrentUser(): Promise<UserProfile | null> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return null;

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }

    return profile;
  },

  /**
   * Met à jour le profil de l'utilisateur
   */
  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
    const { error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', userId);

    if (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  },

  /**
   * Met à jour les préférences de l'utilisateur
   */
  async updatePreferences(userId: string, preferences: Partial<UserProfile['preferences']>): Promise<void> {
    const { data: currentProfile } = await supabase
      .from('user_profiles')
      .select('preferences')
      .eq('id', userId)
      .single();

    const updatedPreferences = {
      ...currentProfile?.preferences,
      ...preferences,
    };

    const { error } = await supabase
      .from('user_profiles')
      .update({ preferences: updatedPreferences })
      .eq('id', userId);

    if (error) {
      console.error('Error updating user preferences:', error);
      throw error;
    }
  },

  /**
   * Met à jour l'avatar de l'utilisateur
   */
  async updateAvatar(userId: string, file: File): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const filePath = `${userId}/avatar.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      console.error('Error uploading avatar:', uploadError);
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    await this.updateProfile(userId, { avatar_url: publicUrl });

    return publicUrl;
  },

  /**
   * Récupère tous les utilisateurs (admin seulement)
   */
  async getAllUsers(): Promise<UserProfile[]> {
    const { data: currentUser } = await supabase.auth.getUser();
    const { data: currentProfile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', currentUser?.user?.id)
      .single();

    if (currentProfile?.role !== 'admin') {
      throw new Error('Unauthorized: Admin access required');
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('full_name');

    if (error) {
      console.error('Error fetching users:', error);
      throw error;
    }

    return data;
  },

  /**
   * Modifie le rôle d'un utilisateur (admin seulement)
   */
  async updateUserRole(userId: string, role: UserProfile['role']): Promise<void> {
    const { data: currentUser } = await supabase.auth.getUser();
    const { data: currentProfile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', currentUser?.user?.id)
      .single();

    if (currentProfile?.role !== 'admin') {
      throw new Error('Unauthorized: Admin access required');
    }

    const { error } = await supabase
      .from('user_profiles')
      .update({ role })
      .eq('id', userId);

    if (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  }
};
