'use client';

import styles from './IvyLayout.module.scss';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import clsx from 'clsx';
import { signOut } from 'firebase/auth';
import { auth } from '@/firebase/config';
import { Button } from '@mantine/core';
import { IconLogout } from '@tabler/icons-react';
import Image from 'next/image';
import { APP_VERSION } from '@/config/version';

interface IvyLayoutProps {
  children: React.ReactNode;
}

export const IvyLayout = ({ children }: IvyLayoutProps) => {
  const router = useRouter();
  const pathname = usePathname();

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
      title: 'IVY',
      items: [
        {
          href: '/ivy',
          label: 'Accueil',
        },
      ],
    },
  ];

  return (
    <div className={styles.view}>
      <div className={styles.menu}>
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
