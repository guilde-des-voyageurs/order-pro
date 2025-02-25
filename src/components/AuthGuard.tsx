'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

const PUBLIC_PATHS = ['/login'];

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading } = useAuth();

  console.log('AuthGuard - pathname:', pathname);
  console.log('AuthGuard - user:', user);
  console.log('AuthGuard - isLoading:', isLoading);

  useEffect(() => {
    const isPublicPath = PUBLIC_PATHS.includes(pathname);
    console.log('AuthGuard - isPublicPath:', isPublicPath);

    if (!isLoading && !user && !isPublicPath) {
      console.log('AuthGuard - redirecting to login');
      router.replace('/login');
    }
  }, [user, isLoading, router, pathname]);

  // Ne rien afficher pendant le chargement
  if (isLoading) {
    return null;
  }

  // Si on est sur une page publique ou si l'utilisateur est connecté
  const isPublicPath = PUBLIC_PATHS.includes(pathname);
  if (isPublicPath || user) {
    return <>{children}</>;
  }

  // Dans tous les autres cas, ne rien afficher
  return null;
}
