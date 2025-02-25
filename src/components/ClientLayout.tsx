'use client';

import React from 'react';
import { MantineProvider } from '@mantine/core';
import { QueryClientProvider } from '@/state/QueryClientProvider';
import { MainLayout } from '@/layout/MainLayout';

interface ClientLayoutProps {
  theme: any;
  children: React.ReactNode;
}

export function ClientLayout({ theme, children }: ClientLayoutProps) {
  return (
    <MantineProvider theme={theme}>
      <QueryClientProvider>
        <MainLayout>
          {children}
        </MainLayout>
      </QueryClientProvider>
    </MantineProvider>
  );
}
