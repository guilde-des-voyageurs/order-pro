'use client';

import styles from './MainLayout.module.scss';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import clsx from 'clsx';
import { SyncButton } from '@/components/SyncButton/SyncButton';
import { signOut } from 'firebase/auth';
import { auth } from '@/firebase/config';
import { Button } from '@mantine/core';
import { IconLogout } from '@tabler/icons-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/db';

interface MenuItem {
  href: string;
  label: string;
}

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);

  useEffect(() => {
    const ordersRef = collection(db, 'orders-v2');
    const q = query(ordersRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const count = snapshot.docs.filter(doc => {
        const data = doc.data();
        return data.displayFulfillmentStatus?.toLowerCase() !== 'fulfilled';
      }).length;
      setPendingOrdersCount(count);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  const menuItems: MenuItem[] = [
    {
      href: '/orders',
      label: `Commandes (${pendingOrdersCount})`,
    },
    {
      href: '/textile',
      label: 'Textile',
    },
    {
      href: '/facturation',
      label: 'Facturation',
    }
  ];

  return (
    <div className={styles.view}>
      <div className={styles.menu}>
        <Image
          className={styles.menu_logo}
          src="/runesdechene.png"
          alt="Runes de Chêne"
          width={200}
          height={62}
          priority
        />
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
        <div className={styles.menu_footer}>
          <Button 
            variant="subtle" 
            color="gray" 
            leftSection={<IconLogout size={16} />}
            onClick={handleLogout}
          >
            Déconnexion
          </Button>
        </div>
      </div>
      <div className={styles.content}>{children}</div>
    </div>
  );
};
