'use client';

import styles from './HomePage.module.scss';
import { clsx } from 'clsx';
import { useState } from 'react';
import { OrderDetailsSection } from '@/pages/home/OrderDetailsSection';
import { Badge } from '@/components/Badge';

export const HomePage = () => {
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <div className={styles.view}>
      <div className={styles.main_content}>
        <h2>Commandes à la demande</h2>
        <section className={styles.section}>
          <Badge variant={'orange'}>En cours (2)</Badge>
          <div className={styles.section_subtitle}>
            Total : 2 Creator, 1 Drummer
          </div>
          <div className={styles.rows}>
            <div
              className={clsx(styles.row, selected === 0 && styles.row_active)}
              onClick={() => setSelected(0)}
            >
              <div className={styles.row_id}>#1194</div>
              <div className={styles.row_date}>03-01-2024</div>
              <div className={styles.row_quantity}>
                2 article(s) à la demande
              </div>
            </div>
            <div
              className={clsx(styles.row, selected === 1 && styles.row_active)}
              onClick={() => setSelected(1)}
            >
              <div className={styles.row_id}>#1193</div>
              <div className={styles.row_date}>02-01-2024</div>
              <div className={styles.row_quantity}>
                1 article(s) à la demande
              </div>
            </div>
          </div>
        </section>
        <section className={styles.section}>
          <Badge variant={'green'}>Traitées (2)</Badge>
          <div className={styles.rows}>
            <div
              className={clsx(styles.row, selected === 2 && styles.row_active)}
              onClick={() => setSelected(2)}
            >
              {' '}
              <div className={styles.row_id}>#1184</div>
              <div className={styles.row_date}>03-01-2024</div>
              <div className={styles.row_quantity}>
                2 article(s) à la demande
              </div>
            </div>
            <div
              className={clsx(styles.row, selected === 3 && styles.row_active)}
              onClick={() => setSelected(3)}
            >
              <div className={styles.row_id}>#1185</div>
              <div className={styles.row_date}>02-01-2024</div>
              <div className={styles.row_quantity}>
                1 article(s) à la demande
              </div>
            </div>
          </div>
        </section>
      </div>
      <OrderDetailsSection
        visible={selected !== null}
        onRequestClose={() => setSelected(null)}
      />
    </div>
  );
};
