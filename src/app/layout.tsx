import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import React from 'react';
import {
  ColorSchemeScript,
  mantineHtmlProps,
  MantineProvider,
} from '@mantine/core';
import { theme } from '@/style/theme';

import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/nprogress/styles.css';
import './globals.scss';
import { MainLayout } from '@/layout/MainLayout';
import { QueryClientProvider } from '@/state/QueryClientProvider';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'OrderPro - Runes de Chêne',
  description: 'App de gestion des commandes',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript />
      </head>
      <body className={`${inter.variable}`}>
        <MantineProvider theme={theme}>
          <QueryClientProvider>
            <MainLayout>{children}</MainLayout>
          </QueryClientProvider>
        </MantineProvider>
      </body>
    </html>
  );
}
