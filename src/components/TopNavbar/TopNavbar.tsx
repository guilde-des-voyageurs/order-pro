'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Button, Group } from '@mantine/core';
import styles from './TopNavbar.module.scss';

export function TopNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  
  const isIvy = pathname.startsWith('/ivy');
  const isAtelier = !isIvy && pathname !== '/';

  return (
    <div className={styles.topNavbar}>
      <Group gap="xs">
        <Button
          variant={isAtelier ? 'filled' : 'subtle'}
          color="blue"
          onClick={() => router.push('/detailed-orders')}
          size="md"
        >
          ATELIER
        </Button>
        <Button
          variant={isIvy ? 'filled' : 'subtle'}
          color="blue"
          onClick={() => router.push('/ivy')}
          size="md"
        >
          IVY
        </Button>
      </Group>
    </div>
  );
}
