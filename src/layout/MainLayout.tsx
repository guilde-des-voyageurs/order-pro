'use client';

import styles from './MainLayout.module.scss';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import clsx from 'clsx';
import { SyncButton } from '@/components/SyncButton/SyncButton';
import { signOut } from 'firebase/auth';
import { auth } from '@/firebase/config';
import { Button } from '@mantine/core';
import { IconLogout, IconCurrencyEuro } from '@tabler/icons-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/db';
import { APP_VERSION } from '@/config/version';

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
  const [stockOrdersCount, setStockOrdersCount] = useState(0);

  useEffect(() => {
    // Compteur des commandes clients
    const unsubscribeOrders = onSnapshot(collection(db, 'orders-v2'), snapshot => {
      const count = snapshot.docs.filter(doc => {
        const data = doc.data();
        return data.displayFulfillmentStatus?.toLowerCase() !== 'fulfilled' 
          && data.displayFinancialStatus?.toLowerCase() !== 'refunded'
          && !data.tags?.some((tag: string) => tag.toLowerCase().includes('batch'));
      }).length;
      setPendingOrdersCount(count);
    });

    // Compteur des commandes stock
    const unsubscribeStock = onSnapshot(collection(db, 'orders-v2'), snapshot => {
      const count = snapshot.docs.filter(doc => {
        const data = doc.data();
        return data.displayFulfillmentStatus?.toLowerCase() !== 'fulfilled' 
          && data.displayFinancialStatus?.toLowerCase() !== 'refunded'
          && data.tags?.some((tag: string) => tag.toLowerCase().includes('batch'));
      }).length;
      setStockOrdersCount(count);
    });

    return () => {
      unsubscribeOrders();
      unsubscribeStock();
    };
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  const menuCategories = [
    {
      title: 'Commandes clients',
      items: [
        {
          href: '/detailed-orders',
          label: `Commandes (${pendingOrdersCount})`,
        },
        {
          href: '/textile',
          label: 'Textile à commander',
        },
        {
          href: '/facturation-v2',
          label: 'Facturation',
        },
        {
          href: '/archived-orders',
          label: 'Commandes archivées',
        },
      ],
    },
    {
      title: 'Commandes stock',
      items: [
        {
          href: '/batch',
          label: `Batch en cours (${stockOrdersCount})`
        },
        {
          href: '/textile-batch',
          label: 'Textile à commander'
        },
        {
          href: '/stock-invoices',
          label: 'Facturation',
        },
        {
          href: '/archived-batch',
          label: 'Batchs archivés',
        },
      ],
    },
    {
      title: 'Réglages',
      items: [
        {
          href: '/price-rules',
          label: 'Règles de prix',
        },
        {
          href: '/color-mappings',
          label: 'Règles de couleur',
        },
      ],
    },
  ];

  return (
    <div className={styles.view}>
      <div className={styles.menu}>
        <div className={styles.menu_sync}>
          <SyncButton />
        </div>
        <ul className={styles.menu_links}>
          {menuCategories.map((category) => (
            <li key={category.title} className={styles.menu_category}>
              <div className={styles.menu_category_title}>{category.title}</div>
              <ul>
                {category.items.map((item) => (
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
