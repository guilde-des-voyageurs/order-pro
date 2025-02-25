'use client';

import { AuthGuard } from '@/components/AuthGuard';
import { MainLayout } from '@/layout/MainLayout';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <MainLayout>{children}</MainLayout>
    </AuthGuard>
  );
}
