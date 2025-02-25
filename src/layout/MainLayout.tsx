'use client';

import styles from './MainLayout.module.scss';
import Logo from '../assets/runesdechene.png';
import { useAuth } from '@/state/AuthProvider';
import { Button } from '@mantine/core';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import clsx from 'clsx';
import { SyncButton } from '@/components/SyncButton/SyncButton';
import { auth } from '@/firebase/config';
import { signOut } from 'firebase/auth';

interface MenuItem {
  href: string;
  label: string;
}

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      await router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const menuItems: MenuItem[] = [
    {
      href: '/orders',
      label: 'Commandes',
    },
    {
      href: '/textile',
      label: 'Textile',
    }
  ];

  if (!user) {
    return children;
  }

  return (
    <div className={styles.view}>
      <div className={styles.menu}>
        <img className={styles.menu_logo} src={Logo.src} alt="Runes de Chêne" />
        <div className={styles.menu_sync}>
          <SyncButton />
        </div>
        <ul className={styles.menu_links}>
          {menuItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={clsx({
                  [styles.active]: pathname === item.href,
                })}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        <Button 
          onClick={handleSignOut}
          className={styles.menu_signout}
          variant="subtle"
        >
          Déconnexion
        </Button>
      </div>
      <div className={styles.content}>
        {children}
      </div>
    </div>
  );
};
