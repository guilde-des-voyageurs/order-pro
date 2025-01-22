import type { Metadata } from 'next';
import { Inter, Alegreya } from 'next/font/google';
import React from 'react';
import {
  ColorSchemeScript,
  MantineProvider,
} from '@mantine/core';
import { theme } from '@/style/theme';
import { QueryClientProvider } from '@/state/QueryClientProvider';
import { AuthProvider } from '@/context/AuthContext';
import { MainLayout } from '@/layout/MainLayout';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/nprogress/styles.css';
import './globals.scss';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const alegreya = Alegreya({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  variable: '--font-alegreya',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'OrderPro - Runes de Chêne',
  description: 'App de gestion des commandes',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        <ColorSchemeScript />
      </head>
      <body className={`${inter.variable} ${alegreya.variable}`}>
        <MantineProvider theme={theme}>
          <AuthProvider>
            <QueryClientProvider>
              <MainLayout>
                {children}
              </MainLayout>
            </QueryClientProvider>
          </AuthProvider>
        </MantineProvider>
      </body>
    </html>
  );
}
