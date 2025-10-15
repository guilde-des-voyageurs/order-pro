'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Button, Group, Text } from '@mantine/core';
import Image from 'next/image';
import { APP_VERSION } from '@/config/version';
import styles from './TopNavbar.module.scss';

export function TopNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  
  const isIvy = pathname.startsWith('/ivy');
  const isAtelier = !isIvy && pathname !== '/';

  return (
    <div className={styles.topNavbar}>
      <Group gap="md">
        <Image
          src="/runesdechene.png"
          alt="Runes de Chêne"
          width={160}
          height={66}
          priority
          style={{ objectFit: 'contain' }}
        />
        <Group gap="xs">
          <Button
            variant={isAtelier ? 'filled' : 'subtle'}
            color="orange"
            onClick={() => router.push('/detailed-orders')}
            size="md"
            className={isAtelier ? styles.activeButton : styles.inactiveButton}
          >
            ATELIER
          </Button>
          <Button
            variant={isIvy ? 'filled' : 'subtle'}
            color="orange"
            onClick={() => router.push('/ivy')}
            size="md"
            className={isIvy ? styles.activeButton : styles.inactiveButton}
          >
            IVY
          </Button>
        </Group>
      </Group>
      
      <Text size="sm" c="dimmed">v{APP_VERSION}</Text>
    </div>
  );
}
