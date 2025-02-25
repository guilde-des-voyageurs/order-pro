'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '@/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => { throw new Error('AuthContext not initialized') },
  signOut: async () => { throw new Error('AuthContext not initialized') },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Écouter les changements d'état d'authentification
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    // Nettoyer l'écouteur lors du démontage
    return () => unsubscribe();
  }, []);

  const handleSignIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const handleSignOut = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signIn: handleSignIn,
      signOut: handleSignOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
