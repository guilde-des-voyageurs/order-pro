'use client';

import React from 'react';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { QueryClientProvider } from '@/state/QueryClientProvider';
import { MainLayout } from '@/layout/MainLayout';

interface ClientLayoutProps {
  theme: any;
  children: React.ReactNode;
}

export function ClientLayout({ theme, children }: ClientLayoutProps) {
  return (
    <MantineProvider theme={theme}>
      <Notifications />
      <QueryClientProvider>
        <MainLayout>
          {children}
        </MainLayout>
      </QueryClientProvider>
    </MantineProvider>
  );
}
