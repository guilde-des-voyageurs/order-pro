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
  const { user, loading } = useAuth();

  console.log('AuthGuard - pathname:', pathname);
  console.log('AuthGuard - user:', user);
  console.log('AuthGuard - loading:', loading);

  useEffect(() => {
    const isPublicPath = pathname ? PUBLIC_PATHS.includes(pathname) : false;
    console.log('AuthGuard - isPublicPath:', isPublicPath);

    if (!loading && !user && !isPublicPath) {
      console.log('AuthGuard - redirecting to login');
      router.replace('/login');
    }
  }, [user, loading, router, pathname]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user && !pathname?.startsWith('/login')) {
    return null;
  }

  return <>{children}</>;
}
