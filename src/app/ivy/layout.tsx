'use client';

import { IvyLayout } from '@/layout/IvyLayout';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <IvyLayout>{children}</IvyLayout>;
}
