'use client';

import React from 'react';
import { MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';
import { QueryClientProvider } from '@/state/QueryClientProvider';
import { MainLayout } from '@/layout/MainLayout';
import { TopNavbar } from '@/components/TopNavbar/TopNavbar';
import { usePathname } from 'next/navigation';

interface ClientLayoutProps {
  theme: any;
  children: React.ReactNode;
}

export function ClientLayout({ theme, children }: ClientLayoutProps) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';
  const isIvySection = pathname.startsWith('/ivy');

  return (
    <MantineProvider theme={theme}>
      <ModalsProvider>
        <Notifications />
        <QueryClientProvider>
          {!isLoginPage && <TopNavbar />}
          {!isLoginPage && !isIvySection ? (
            <MainLayout>{children}</MainLayout>
          ) : (
            children
          )}
        </QueryClientProvider>
      </ModalsProvider>
    </MantineProvider>
  );
}
