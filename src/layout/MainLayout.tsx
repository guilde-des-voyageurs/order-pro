'use client';

import styles from './MainLayout.module.scss';
import Logo from '../assets/runesdechene.png';
import { useAuthContext } from '@/context/AuthContext';
import { Button } from '@mantine/core';
import { useRouter } from 'next/navigation';

export const MainLayout = ({ children }: { children: any }) => {
  const { signOut, user } = useAuthContext();
  const router = useRouter();

  const handleSignOut = async () => {
    const result = await signOut();
    if (!result.error) {
      router.push('/login');
    }
  };

  return (
    <div className={styles.view}>
      <div className={styles.menu}>
        <img className={styles.menu_logo} src={Logo.src} alt="Runes de Chêne" />
        <ul className={styles.menu_links}>
          <li>
            <a href={'/'}>Commandes</a>
          </li>
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
