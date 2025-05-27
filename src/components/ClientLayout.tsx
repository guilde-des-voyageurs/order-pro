'use client';

import React from 'react';
import { MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
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
      <ModalsProvider>
        <Notifications />
        <QueryClientProvider>
          <MainLayout>
            {children}
          </MainLayout>
        </QueryClientProvider>
      </ModalsProvider>
    </MantineProvider>
  );
}
