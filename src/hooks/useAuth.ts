'use client';

import { useEffect, useState } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '@/firebase/config';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('Setting up auth listener');
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user ? 'User logged in' : 'No user');
      
      if (user) {
        // Obtenir le token et le stocker dans un cookie
        const token = await user.getIdToken();
        document.cookie = `__session=${token}; path=/`;
      } else {
        // Supprimer le cookie de session
        document.cookie = '__session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      }
      
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Tentative de connexion Firebase...');
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Connexion Firebase réussie');
      
      // Le cookie sera géré par le listener onAuthStateChanged
      return { user: userCredential.user, error: null };
    } catch (error: any) {
      console.error('Erreur Firebase:', error);
      return { user: null, error: error.message };
    }
  };

  const signOut = async () => {
    try {
      console.log('Déconnexion Firebase...');
      await firebaseSignOut(auth);
      // Le cookie sera supprimé par le listener onAuthStateChanged
      console.log('Déconnexion Firebase réussie');
      return { error: null };
    } catch (error: any) {
      console.error('Erreur Firebase:', error);
      return { error: error.message };
    }
  };

  return {
    user,
    loading,
    signIn,
    signOut,
  };
}
