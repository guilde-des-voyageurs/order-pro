'use client';

import { Text, Title, Stack, Group } from '@mantine/core';
import { forwardRef } from 'react';
import styles from './OrderPrintContent.module.scss';
import { generatePrintContent } from './PrintContent';

interface OrderPrintContentProps {
  order: any;
}

export const OrderPrintContent = forwardRef<HTMLDivElement, OrderPrintContentProps>(({ order }, ref) => (
  <div ref={ref} className={styles.print_content} dangerouslySetInnerHTML={{ __html: generatePrintContent({ order }) }} />
));
