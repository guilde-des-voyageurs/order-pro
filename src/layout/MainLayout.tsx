'use client';

import styles from './MainLayout.module.scss';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import clsx from 'clsx';
import { SyncButton } from '@/components/SyncButton/SyncButton';
import { useShop } from '@/context/ShopContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/supabase/client';

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
  const { currentShop, hasShops, loading: shopLoading } = useShop();
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);

  useEffect(() => {
    if (!currentShop) return;

    // Fonction pour charger les compteurs
    const loadCounts = async () => {
      // Compteur des commandes clients
      const { data: clientOrders } = await supabase
        .from('orders')
        .select('id, tags')
        .eq('shop_id', currentShop.id)
        .neq('display_fulfillment_status', 'FULFILLED')
        .neq('display_financial_status', 'REFUNDED');

      const pendingCount = clientOrders?.filter(order => 
        !order.tags?.some((tag: string) => tag.toLowerCase().includes('batch'))
      ).length || 0;
      setPendingOrdersCount(pendingCount);
    };

    loadCounts();

    // Écouter les changements en temps réel
    const channel = supabase
      .channel('orders-count')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `shop_id=eq.${currentShop.id}` },
        () => loadCounts()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentShop]);

  // Rediriger vers onboarding si pas de boutique (seulement après le chargement)
  useEffect(() => {
    if (shopLoading) return; // Attendre que le chargement soit terminé
    if (!hasShops && pathname !== '/onboarding' && pathname !== '/login' && pathname !== '/signup') {
      router.push('/onboarding');
    }
  }, [hasShops, shopLoading, pathname, router]);

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
      </div>
      <div className={styles.content}>{children}</div>
    </div>
  );
};
