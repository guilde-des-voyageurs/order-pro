'use client';

import styles from './IvyLayout.module.scss';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import clsx from 'clsx';
import { Button } from '@mantine/core';
import { IconHome, IconPackage, IconTruck, IconChartBar, IconPrinter, IconShoppingCart, IconFileInvoice, IconArchive, IconRefresh, IconChecklist } from '@tabler/icons-react';
import { LocationProvider } from '@/context/LocationContext';
import { LocationSelector } from '@/components/LocationSelector';

interface IvyLayoutProps {
  children: React.ReactNode;
}

function IvyLayoutContent({ children }: IvyLayoutProps) {
  const pathname = usePathname();
  
  const isCommandesSection = pathname.startsWith('/ivy/commandes');
  const isInventaireSection = pathname.startsWith('/ivy/inventaire');

  // Menu contextuel selon la section
  const commandesMenu = [
    {
      title: '',
      items: [
        {
          href: '/ivy/commandes',
          label: 'Vue d\'ensemble',
          icon: IconHome,
        },
      ],
    },
    {
      title: 'Commandes boutique',
      items: [
        {
          href: '/ivy/commandes/boutique',
          label: 'Commandes',
          icon: IconShoppingCart,
        },
        {
          href: '/ivy/commandes/boutique/suivi',
          label: 'Suivi interne',
          icon: IconChecklist,
        },
        {
          href: '/ivy/commandes/boutique/facturation',
          label: 'Facturation',
          icon: IconFileInvoice,
        },
        {
          href: '/ivy/commandes/boutique/archives',
          label: 'Archives',
          icon: IconArchive,
        },
      ],
    },
    {
      title: 'Commandes stock',
      items: [
        {
          href: '/ivy/commandes/stock',
          label: 'Commandes',
          icon: IconTruck,
        },
      ],
    },
  ];

  const inventaireMenu = [
    {
      title: 'Inventaire',
      items: [
        {
          href: '/ivy/inventaire',
          label: 'Tableau de bord',
          icon: IconHome,
        },
        {
          href: '/ivy/inventaire/produits',
          label: 'Produits',
          icon: IconPackage,
        },
        {
          href: '/ivy/inventaire/statistiques',
          label: 'Statistiques',
          icon: IconChartBar,
        },
      ],
    },
  ];

  const menuCategories = isCommandesSection ? commandesMenu : inventaireMenu;

  return (
    <div className={styles.view}>
      <div className={styles.menu}>
        <div className={styles.menu_header}>
          {isCommandesSection ? (
            <Button
              variant="light"
              leftSection={<IconRefresh size={16} />}
              fullWidth
            >
              Synchroniser
            </Button>
          ) : (
            <LocationSelector />
          )}
        </div>
        <ul className={styles.menu_links}>
          {menuCategories.map((category) => (
            <li key={category.title || 'main'} className={styles.menu_category}>
              {category.title && (
                <div className={styles.menu_category_title}>{category.title}</div>
              )}
              <ul>
                {category.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={clsx({
                          [styles.active]: isActive,
                        })}
                      >
                        <Icon size={16} />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>
      </div>
      <div className={styles.content}>{children}</div>
    </div>
  );
}

// Wrapper avec le LocationProvider
export const IvyLayout = ({ children }: IvyLayoutProps) => {
  return (
    <LocationProvider>
      <IvyLayoutContent>{children}</IvyLayoutContent>
    </LocationProvider>
  );
};
