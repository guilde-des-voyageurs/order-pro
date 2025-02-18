'use client';

import styles from './TextilePage.module.scss';
import { Title } from '@mantine/core';

export const TextilePage = () => {
  return (
    <div className={styles.view}>
      <div className={styles.main_content}>
        <Title order={2}>Textile</Title>
      </div>
    </div>
  );
};
