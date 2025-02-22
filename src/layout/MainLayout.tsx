'use client';

import styles from './MainLayout.module.scss';
import Logo from '../assets/runesdechene.png';
import { useAuthContext } from '@/context/AuthContext';
import { Button } from '@mantine/core';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import clsx from 'clsx';
import { SyncButton } from '@/components/SyncButton/SyncButton';

export const MainLayout = ({ children }: { children: any }) => {
  const { signOut, user } = useAuthContext();
  const router = useRouter();
  const pathname = usePathname();

  const handleSignOut = async () => {
    const result = await signOut();
    if (!result.error) {
      router.push('/login');
    }
  };

  const menuItems = [
    { href: '/', label: 'Commandes' },
    { href: '/textile', label: 'Textile' },
  ];

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
        {user && (
          <div className={styles.menu_footer}>
            <Button
              variant="subtle"
              color="gray"
              onClick={handleSignOut}
              className={styles.signout_button}
            >
              Se déconnecter
            </Button>
          </div>
        )}
      </div>
      <main className={styles.main}>{children}</main>
    </div>
  );
};
