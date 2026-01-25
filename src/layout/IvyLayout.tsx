'use client';

import styles from './IvyLayout.module.scss';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import clsx from 'clsx';
import { IconHome, IconPackage, IconTruck, IconChartBar } from '@tabler/icons-react';
import { LocationProvider } from '@/context/LocationContext';
import { LocationSelector } from '@/components/LocationSelector';

interface IvyLayoutProps {
  children: React.ReactNode;
}

function IvyLayoutContent({ children }: IvyLayoutProps) {
  const pathname = usePathname();

  const menuCategories = [
    {
      title: 'IVY',
      items: [
        {
          href: '/ivy',
          label: 'Tableau de bord',
          icon: IconHome,
        },
        {
          href: '/ivy/inventory',
          label: 'Inventaire',
          icon: IconPackage,
        },
        {
          href: '/ivy/suppliers',
          label: 'Fournisseurs',
          icon: IconTruck,
        },
        {
          href: '/ivy/analytics',
          label: 'Statistiques',
          icon: IconChartBar,
        },
      ],
    },
  ];

  return (
    <div className={styles.view}>
      <div className={styles.menu}>
        <div className={styles.menu_header}>
          <LocationSelector />
        </div>
        <ul className={styles.menu_links}>
          {menuCategories.map((category) => (
            <li key={category.title} className={styles.menu_category}>
              <div className={styles.menu_category_title}>{category.title}</div>
              <ul>
                {category.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={clsx({
                          [styles.active]: pathname === item.href,
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
