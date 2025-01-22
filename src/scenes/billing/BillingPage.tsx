'use client';

import styles from './BillingPage.module.scss';
import { Title } from '@mantine/core';

export const BillingPage = () => {
  return (
    <div className={styles.view}>
      <div className={styles.main_content}>
        <Title order={2}>Facturation</Title>
      </div>
    </div>
  );
};
