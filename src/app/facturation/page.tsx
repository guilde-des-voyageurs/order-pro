'use client';

import { Title } from '@mantine/core';
import styles from './facturation.module.scss';

export default function FacturationPage() {
  return (
    <div className={styles.container}>
      <Title order={2} className={styles.title}>
        Facturation
      </Title>
    </div>
  );
}
